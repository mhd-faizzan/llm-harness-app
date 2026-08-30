import { useEffect, useMemo, useState } from "react";
import {
  PanelLeft,
  Search,
  Settings,
  SquarePen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { IconButton } from "@/components/ui/IconButton";
import { groupConversations } from "@/lib/time";
import { getTitleOverride } from "@/lib/titles";
import type { Conversation } from "@/types/chat";

interface SidebarProps {
  conversations: Conversation[];
  status: "loading" | "ready" | "error";
  activeId?: string;
  collapsed: boolean;
  isMobile: boolean;
  drawerOpen: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onToggleCollapsed: () => void;
  onCloseDrawer: () => void;
}

const USER_EMAIL = "faizzan221@gmail.com";

function useDebounced<T>(value: T, delay = 180) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SidebarInner({
  conversations,
  status,
  activeId,
  onSelect,
  onNew,
  onToggleCollapsed,
  isMobile,
  onCloseDrawer,
}: Omit<SidebarProps, "collapsed" | "drawerOpen">) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  // Re-render when a local title override changes.
  const [, force] = useState(0);
  useEffect(() => {
    const h = () => force((n) => n + 1);
    window.addEventListener("harness:titles", h);
    return () => window.removeEventListener("harness:titles", h);
  }, []);

  const titleOf = (c: Conversation) =>
    getTitleOverride(c.id) || c.title || "New chat";

  const groups = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const filtered = q
      ? conversations.filter((c) => titleOf(c).toLowerCase().includes(q))
      : conversations;
    return groupConversations(filtered);
  }, [conversations, debouncedQuery]);

  return (
    <div className="safe-pl flex h-full flex-col bg-sidebar">
      <div className="flex items-center justify-between p-2">
        {isMobile ? (
          <IconButton label="Close menu" onClick={onCloseDrawer}>
            <X size={18} />
          </IconButton>
        ) : (
          <IconButton label="Collapse sidebar" onClick={onToggleCollapsed}>
            <PanelLeft size={17} />
          </IconButton>
        )}
      </div>

      <div className="px-2">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-medium text-foreground transition-colors hover:bg-surface"
        >
          <SquarePen size={16} />
          New chat
        </button>

        <div className="relative mt-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="w-full rounded-lg bg-transparent py-2 pl-8 pr-2 text-[13.5px] text-foreground outline-none placeholder:text-faint focus:bg-surface"
          />
        </div>
      </div>

      <nav className="scrollable mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {status === "error" && (
          <p className="px-2.5 py-2 text-[12.5px] leading-relaxed text-faint">
            Can’t reach the server. Start the backend, then reload.
          </p>
        )}
        {status === "ready" && groups.length === 0 && (
          <p className="px-2.5 py-2 text-[12.5px] text-faint">
            {debouncedQuery ? "No matching chats." : "No conversations yet."}
          </p>
        )}

        {groups.map((group) => (
          <div key={group.bucket} className="mb-1">
            <div className="px-2.5 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wider text-faint">
              {group.bucket}
            </div>
            {group.items.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                title={titleOf(conv)}
                className={cn(
                  "block w-full truncate rounded-lg px-2.5 py-2 text-left text-[13.5px] text-muted transition-colors hover:bg-surface hover:text-foreground",
                  conv.id === activeId && "bg-surface font-medium text-foreground"
                )}
              >
                {titleOf(conv)}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-2">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-claude text-[12px] font-semibold text-white">
            {USER_EMAIL.charAt(0).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium text-foreground">
              {USER_EMAIL}
            </span>
            <span className="text-[11.5px] text-faint">Free plan</span>
          </span>
          <IconButton label="Settings" size="sm" className="ml-auto" disabled>
            <Settings size={15} />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const { collapsed, isMobile, drawerOpen, onCloseDrawer } = props;
  const trapRef = useFocusTrap<HTMLElement>(isMobile && drawerOpen);

  // Close the mobile drawer on Escape.
  useEffect(() => {
    if (!isMobile || !drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, drawerOpen, onCloseDrawer]);

  if (isMobile) {
    return (
      <>
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
            onClick={onCloseDrawer}
            aria-hidden
          />
        )}
        <aside
          ref={trapRef}
          role="dialog"
          aria-modal={drawerOpen}
          aria-label="Chat history"
          tabIndex={-1}
          inert={!drawerOpen}
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[280px] shadow-2xl transition-transform duration-200 ease-out",
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SidebarInner {...props} />
        </aside>
      </>
    );
  }

  // Desktop: collapses to zero width — no residual rail or divider line.
  return (
    <aside
      aria-hidden={collapsed}
      inert={collapsed}
      className={cn(
        "h-full shrink-0 overflow-hidden transition-[width] duration-200 ease-out",
        collapsed ? "w-0" : "w-[264px]"
      )}
    >
      <div className="h-full w-[264px]">
        <SidebarInner {...props} />
      </div>
    </aside>
  );
}
