import { useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { ArrowUp, Plus, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelSelector } from "./ModelSelector";

interface ComposerProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  model: string;
  onModelChange: (id: string) => void;
}

const MAX_HEIGHT = 200; // ~8 lines

export function Composer({
  onSend,
  onStop,
  isStreaming,
  model,
  onModelChange,
}: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0;

  return (
    <div className="safe-pb mx-auto w-full max-w-3xl px-4 pb-4 sm:px-6">
      <div
        className="flex flex-col gap-1.5 rounded-[1.75rem] p-2 pl-3.5 backdrop-blur-md shadow-[var(--shadow-composer)]"
        style={{ background: "var(--composer-bg)" }}
      >
        <textarea
          ref={textareaRef}
          id="composer"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Ask anything…"
          aria-label="Message"
          autoComplete="off"
          spellCheck
          className="scrollable max-h-[200px] w-full resize-none bg-transparent py-2 text-[16px] leading-relaxed text-foreground outline-none placeholder:text-faint"
        />

        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled
            aria-label="Add attachment (unavailable)"
            title="Attachments coming soon"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted opacity-40"
          >
            <Plus size={18} />
          </button>

          <div className="flex items-center gap-1.5">
            <ModelSelector value={model} onChange={onModelChange} compact />
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                title="Stop"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95"
              >
                <Square size={15} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canSend}
                aria-label="Send message"
                title="Send"
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95",
                  "disabled:cursor-not-allowed disabled:opacity-30"
                )}
              >
                <ArrowUp size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[10.5px] text-foreground/40">
        Grounded in real tools. Responses can still be wrong.
      </p>
    </div>
  );
}
