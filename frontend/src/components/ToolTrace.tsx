import { Search, Calculator, Type, Clock, Check, Loader2 } from "lucide-react";
import type { ToolCall } from "../types";

const ICONS: Record<string, typeof Search> = {
  web_search: Search,
  calculate: Calculator,
  count_letter: Type,
  get_current_time: Clock,
};

const LABELS: Record<string, string> = {
  web_search: "searching web",
  calculate: "calculating",
  count_letter: "counting letters",
  get_current_time: "checking the time",
};

export function ToolTrace({ toolCall }: { toolCall: ToolCall }) {
  const Icon = ICONS[toolCall.name] ?? Search;
  const label = LABELS[toolCall.name] ?? toolCall.name;

  return (
    <div className="tool-trace">
      <span className="tool-trace-icon">
        {toolCall.status === "running" ? (
          <Loader2 size={13} className="spin" />
        ) : (
          <Check size={13} />
        )}
      </span>
      <Icon size={13} />
      <span>{label}</span>
    </div>
  );
}