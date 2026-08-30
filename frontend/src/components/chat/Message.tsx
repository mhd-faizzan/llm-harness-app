import { memo, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { MarkdownAsync } from "./MarkdownAsync";
import { ToolTrace } from "./ToolTrace";

interface MessageProps {
  message: ChatMessage;
  isLastAssistant: boolean;
  isStreaming: boolean;
  onRegenerate: () => void;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-2" aria-label="Assistant is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-faint"
          style={{ animation: "dot-pulse 1.2s infinite ease-in-out", animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export const Message = memo(function Message({
  message,
  isLastAssistant,
  isStreaming,
  onRegenerate,
}: MessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const streamingHere = isLastAssistant && isStreaming;
  const showCaret = streamingHere && message.content.length > 0;
  const showDots =
    !isUser && message.content.length === 0 && message.toolCalls.length === 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={cn(
        "group animate-message-in py-3",
        isUser ? "flex flex-col items-end" : "flex flex-col items-start"
      )}
    >
      {isUser ? (
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-md bg-user-bubble px-4 py-2.5 text-[15.5px] leading-relaxed">
          {message.content}
        </div>
      ) : (
        <div className="w-full">
          {message.toolCalls.length > 0 && (
            <div className="mb-3 flex flex-col gap-1.5">
              {message.toolCalls.map((tc) => (
                <ToolTrace key={tc.id} toolCall={tc} />
              ))}
            </div>
          )}

          {showDots ? (
            <TypingDots />
          ) : message.content ? (
            <div className="text-[15.5px]">
              <MarkdownAsync>{message.content}</MarkdownAsync>
              {showCaret && (
                <span
                  className="ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[0.15em] bg-foreground"
                  style={{ animation: "caret-blink 1s step-end infinite" }}
                />
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Hover actions */}
      <div
        className={cn(
          "mt-1.5 flex items-center gap-0.5 transition-opacity duration-150",
          isUser ? "justify-end" : "justify-start",
          "opacity-0 group-hover:opacity-100 focus-within:opacity-100",
          streamingHere && "hidden"
        )}
      >
        <button
          type="button"
          onClick={copy}
          aria-label="Copy message"
          title="Copy"
          className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-[12px] text-faint transition-colors hover:bg-surface hover:text-foreground"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
        {!isUser && isLastAssistant && (
          <button
            type="button"
            onClick={onRegenerate}
            aria-label="Regenerate response"
            title="Regenerate"
            className="flex h-7 items-center gap-1.5 rounded-md px-1.5 text-[12px] text-faint transition-colors hover:bg-surface hover:text-foreground"
          >
            <RefreshCw size={13} />
          </button>
        )}
      </div>
    </div>
  );
});
