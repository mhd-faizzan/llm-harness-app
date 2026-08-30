import { useState } from "react";
import {
  Calculator,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  Search,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolCall } from "@/types/chat";

const ICONS: Record<string, LucideIcon> = {
  web_search: Search,
  calculate: Calculator,
  count_letter: Type,
  get_current_time: Clock,
};

const RUNNING_LABELS: Record<string, string> = {
  web_search: "Searching the web",
  calculate: "Calculating",
  count_letter: "Counting letters",
  get_current_time: "Checking the time",
};

const DONE_LABELS: Record<string, string> = {
  web_search: "Searched the web",
  calculate: "Calculated",
  count_letter: "Counted letters",
  get_current_time: "Checked the time",
};

export function ToolTrace({ toolCall }: { toolCall: ToolCall }) {
  const [open, setOpen] = useState(false);
  const Icon = ICONS[toolCall.name] ?? Search;
  const running = toolCall.status === "running";
  const label =
    (running ? RUNNING_LABELS : DONE_LABELS)[toolCall.name] ?? toolCall.name;
  const hasDetail = Boolean(
    toolCall.result || Object.keys(toolCall.args).length > 0
  );

  return (
    <div className="w-fit max-w-full">
      <button
        type="button"
        disabled={!hasDetail}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[12.5px] text-muted transition-colors",
          hasDetail && "hover:text-foreground"
        )}
      >
        <span className="text-faint">
          {running ? (
            <Loader2 size={13} className="animate-spin-slow" />
          ) : (
            <Check size={13} className="text-accent-openai" />
          )}
        </span>
        <Icon size={13} />
        <span>{label}</span>
        {hasDetail && (
          <ChevronRight
            size={13}
            className={cn("text-faint transition-transform", open && "rotate-90")}
          />
        )}
      </button>

      {open && hasDetail && (
        <div className="mt-1.5 space-y-2 rounded-xl border border-border bg-surface/60 p-3 text-[12.5px]">
          {Object.keys(toolCall.args).length > 0 && (
            <div>
              <div className="mb-1 font-medium uppercase tracking-wider text-faint">
                Input
              </div>
              <pre className="scrollable overflow-x-auto whitespace-pre-wrap break-words font-mono text-[12px] text-muted">
                {JSON.stringify(toolCall.args, null, 2)}
              </pre>
            </div>
          )}
          {toolCall.result && (
            <div>
              <div className="mb-1 font-medium uppercase tracking-wider text-faint">
                Result
              </div>
              <pre className="scrollable max-h-56 overflow-auto whitespace-pre-wrap break-words font-mono text-[12px] text-muted">
                {toolCall.result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
