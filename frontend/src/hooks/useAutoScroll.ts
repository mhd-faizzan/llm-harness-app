import { useCallback, useRef, useState } from "react";

/**
 * Tracks whether a scroll container is "pinned" to the bottom (i.e. the user is
 * reading the latest content) so callers can decide whether to keep following
 * new messages. Scrolling itself is performed by the caller — with a virtualised
 * list that means asking the virtualizer to scroll to the last row.
 */
export function useAutoScroll(thresholdPx = 120) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(true);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsPinned(distanceFromBottom <= thresholdPx);
  }, [thresholdPx]);

  const pin = useCallback(() => setIsPinned(true), []);

  return { containerRef, isPinned, pin, handleScroll };
}
