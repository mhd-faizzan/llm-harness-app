import { useState } from "react";
import type { ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  className?: string;
  children?: ReactNode;
  raw: string;
}

function languageFromClass(className?: string): string | null {
  return /language-([\w-]+)/.exec(className ?? "")?.[1] ?? null;
}

/** Fenced code block with a language label and a copy button (DESIGN.md §4). */
export function CodeBlock({ className, children, raw }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lang = languageFromClass(className);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw.replace(/\n$/, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-border bg-code-bg">
      <div className="flex items-center justify-between border-b border-border/70 px-3 py-1.5">
        <span className="font-mono text-[11px] uppercase tracking-wider text-faint">
          {lang ?? "text"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[11px] text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={cn("scrollable overflow-x-auto p-3.5 text-[13px] leading-relaxed")}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}
