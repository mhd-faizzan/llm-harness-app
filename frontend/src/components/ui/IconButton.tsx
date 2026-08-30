import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required for accessibility — the button has no visible text. */
  label: string;
  size?: Size;
  active?: boolean;
}

/**
 * Square icon button. The hit area is always >= 44px (WCAG 2.5.5) via an
 * invisible ::before overlay, even when the visual box is smaller.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = "md", active = false, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        title={label}
        data-active={active || undefined}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center rounded-lg text-muted transition-colors",
          "before:absolute before:left-1/2 before:top-1/2 before:h-11 before:w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
          "hover:bg-surface hover:text-foreground",
          "disabled:pointer-events-none disabled:opacity-40",
          "data-[active=true]:bg-surface data-[active=true]:text-foreground",
          size === "sm" ? "h-8 w-8" : "h-9 w-9",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
IconButton.displayName = "IconButton";
