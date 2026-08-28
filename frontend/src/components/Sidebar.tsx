import { useEffect, useState } from "react";
import { PanelLeft, PenSquare } from "lucide-react";

const API_URL = "http://localhost:8000";
const STORAGE_KEY = "sidebar-collapsed";

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

interface SidebarProps {
  activeId?: string;
  refreshKey?: number;
  onSelect: (id: string) => void;
  onNew: () => void;
}

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function Sidebar({ activeId, refreshKey, onSelect, onNew }: SidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [collapsed, setCollapsed] = useState(readCollapsed);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore persistence failures
    }
  }, [collapsed]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(`${API_URL}/conversations`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: Conversation[]) => {
        if (cancelled) return;
        setConversations(data);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setConversations([]);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <aside className={`sidebar${collapsed ? " sidebar-collapsed" : ""}`}>
      <div className="sidebar-actions">
        <button
          className="sidebar-btn sidebar-btn-icon"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft size={17} strokeWidth={1.75} />
        </button>
        <button
          className="sidebar-btn sidebar-btn-new"
          onClick={onNew}
          aria-label="New chat"
          title="New chat"
        >
          <PenSquare size={16} strokeWidth={1.75} />
          {!collapsed && <span>New chat</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-scroll">
          <div className="sidebar-label">Recents</div>
          {status === "error" && (
            <p className="sidebar-note">
              Can’t reach the server. Start the backend, then reload.
            </p>
          )}
          {status === "ready" && conversations.length === 0 && (
            <p className="sidebar-note">No conversations yet.</p>
          )}
          <nav className="sidebar-list">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className={`sidebar-row${conv.id === activeId ? " sidebar-row-active" : ""}`}
                onClick={() => onSelect(conv.id)}
                title={conv.title || "New chat"}
              >
                {conv.title || "New chat"}
              </button>
            ))}
          </nav>
        </div>
      )}
    </aside>
  );
}
