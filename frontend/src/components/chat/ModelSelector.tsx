import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODELS, getModel } from "@/lib/models";

interface ModelSelectorProps {
  value: string;
  onChange: (id: string) => void;
  /** Compact rendering for the composer bar. */
  compact?: boolean;
}

export function ModelSelector({ value, onChange, compact = false }: ModelSelectorProps) {
  const current = getModel(value);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-lg text-muted transition-colors hover:bg-surface hover:text-foreground data-[state=open]:bg-surface data-[state=open]:text-foreground",
            compact ? "px-2 py-1 text-[13px]" : "px-2.5 py-1.5 text-sm font-medium"
          )}
        >
          <span className="max-w-[9rem] truncate">{current.label}</span>
          <ChevronDown size={14} className="text-faint" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={compact ? "start" : "end"}
          sideOffset={6}
          className={cn(
            "z-50 min-w-[16rem] rounded-xl border border-border bg-background p-1.5 shadow-xl",
            "data-[state=open]:animate-message-in"
          )}
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-faint">
            Model
          </DropdownMenu.Label>
          {MODELS.map((model) => (
            <DropdownMenu.Item
              key={model.id}
              onSelect={() => onChange(model.id)}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-2 text-sm outline-none",
                "data-[highlighted]:bg-surface"
              )}
            >
              <Check
                size={15}
                className={cn(
                  "mt-0.5 shrink-0",
                  model.id === value ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="flex flex-col">
                <span className="font-medium text-foreground">{model.label}</span>
                <span className="text-[12px] text-muted">{model.description}</span>
              </span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
