import { useEffect, useRef, useState } from "react";
import { Menu, Moon, PanelLeft, Sun, SquarePen } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import type { Theme } from "@/hooks/useTheme";

interface HeaderProps {
  title: string;
  canEditTitle: boolean;
  onRename: (next: string) => void;
  theme: Theme;
  onToggleTheme: () => void;
  onMenuClick: () => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  sidebarCollapsed: boolean;
  isMobile: boolean;
}

export function Header({
  title,
  canEditTitle,
  onRename,
  theme,
  onToggleTheme,
  onMenuClick,
  onToggleSidebar,
  onNewChat,
  sidebarCollapsed,
  isMobile,
}: HeaderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setDraft(title);
    setEditing(true);
  };

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== title) onRename(draft.trim());
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-1 bg-background/80 px-2 backdrop-blur-md sm:px-3">
      {isMobile ? (
        <IconButton label="Open menu" onClick={onMenuClick}>
          <Menu size={18} />
        </IconButton>
      ) : (
        sidebarCollapsed && (
          <>
            <IconButton label="Expand sidebar" onClick={onToggleSidebar}>
              <PanelLeft size={17} />
            </IconButton>
            <IconButton label="New chat" onClick={onNewChat}>
              <SquarePen size={16} />
            </IconButton>
          </>
        )
      )}

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(title);
                setEditing(false);
              }
            }}
            className="w-full max-w-sm rounded-md border border-border bg-surface px-2 py-1 text-[15px] font-medium outline-none"
          />
        ) : (
          // No title until there's a real conversation — the new-chat icon is
          // enough; a "New chat" label here is redundant.
          canEditTitle && (
            <button
              type="button"
              onDoubleClick={startEditing}
              title="Double-click to rename"
              className="max-w-full truncate rounded-md px-2 py-1 text-[15px] font-medium text-foreground hover:bg-surface"
            >
              {title}
            </button>
          )
        )}
      </div>

      <IconButton
        label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
        onClick={onToggleTheme}
      >
        {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
      </IconButton>
    </header>
  );
}
