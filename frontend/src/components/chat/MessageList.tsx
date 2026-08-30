import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowDown } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import type { ChatMessage } from "@/types/chat";
import { Message } from "./Message";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onRegenerate: () => void;
}

export function MessageList({ messages, isStreaming, onRegenerate }: MessageListProps) {
  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message?.role === "assistant") return message.id;
    }
    return null;
  }, [messages]);

  const { containerRef, isPinned, pin, handleScroll } = useAutoScroll();

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 140,
    overscan: 6,
    // Keep row identity stable across streaming updates so measurements persist.
    getItemKey: (index) => messages[index]?.id ?? index,
  });

  const items = virtualizer.getVirtualItems();

  // Follow the stream while the user is pinned to the bottom.
  const tail = messages.at(-1);
  const streamSignal = `${messages.length}:${tail?.id ?? ""}:${tail?.content.length ?? 0}`;
  useLayoutEffect(() => {
    if (isPinned && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamSignal, isPinned]);

  // Announce turn completion to screen readers (DESIGN.md §6).
  const [announcement, setAnnouncement] = useState("");
  const wasStreaming = useRef(isStreaming);
  useEffect(() => {
    if (wasStreaming.current && !isStreaming) {
      setAnnouncement("Response complete.");
      const t = setTimeout(() => setAnnouncement(""), 1000);
      return () => clearTimeout(t);
    }
    wasStreaming.current = isStreaming;
  }, [isStreaming]);

  const jumpToLatest = () => {
    pin();
    virtualizer.scrollToIndex(messages.length - 1, { align: "end" });
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="scrollable h-full overflow-y-auto"
      >
        {/* Announce whole messages as they arrive, not every streamed token,
            so screen readers aren't flooded during generation. */}
        <div
          role="log"
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions"
          className="relative mx-auto w-full max-w-3xl px-4 pb-6 pt-6 sm:px-6"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {items.map((item) => {
            const message = messages[item.index];
            if (!message) return null;
            return (
              <div
                key={item.key}
                data-index={item.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 right-0"
                style={{ transform: `translateY(${item.start}px)` }}
              >
                <Message
                  message={message}
                  isLastAssistant={message.id === lastAssistantId}
                  isStreaming={isStreaming}
                  onRegenerate={onRegenerate}
                />
              </div>
            );
          })}
        </div>
      </div>

      {!isPinned && (
        <button
          type="button"
          onClick={jumpToLatest}
          aria-label="Scroll to latest"
          className="absolute bottom-4 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-muted shadow-lg transition-colors hover:text-foreground"
        >
          <ArrowDown size={16} />
        </button>
      )}

      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
