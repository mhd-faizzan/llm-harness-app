import { useCallback, useEffect, useState } from "react";

const COLLAPSE_KEY = "harness-sidebar-collapsed";
const MOBILE_QUERY = "(max-width: 1023px)";

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Sidebar state: a persisted collapse toggle on desktop, and a transient
 * drawer that overlays the content on mobile.
 */
export function useSidebar() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = () => {
      setIsMobile(mql.matches);
      if (!mql.matches) setDrawerOpen(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore persistence failures
    }
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return {
    isMobile,
    collapsed: isMobile ? false : collapsed,
    drawerOpen,
    toggleCollapsed,
    openDrawer,
    closeDrawer,
  };
}
