import { useCallback, useEffect, useState } from "react";
import type { Conversation } from "@/types/chat";

const API_URL = "http://localhost:8000";

type Status = "loading" | "ready" | "error";

interface ConversationRow {
  id: string;
  title: string;
  created_at: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [status, setStatus] = useState<Status>("loading");

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/conversations`);
      if (!res.ok) throw new Error(String(res.status));
      const rows: ConversationRow[] = await res.json();
      setConversations(
        rows.map((r) => ({ id: r.id, title: r.title, createdAt: r.created_at }))
      );
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { conversations, status, refresh };
}
