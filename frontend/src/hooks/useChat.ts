import { useCallback, useRef, useState } from "react";
import type { ChatMessage, StreamEvent, ToolCall } from "@/types/chat";

const API_URL = "http://localhost:8000";

function makeId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

function now() {
  return new Date().toISOString();
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string>(makeId);
  const abortRef = useRef<AbortController | null>(null);

  const newConversation = useCallback(() => {
    abortRef.current?.abort();
    setConversationId(makeId());
    setMessages([]);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    setConversationId(id);
    const res = await fetch(`${API_URL}/conversations/${id}/messages`);
    if (!res.ok) throw new Error(`request failed (${res.status})`);
    const rows: { id: string; role: string; content: string; created_at?: string }[] =
      await res.json();
    setMessages(
      rows.map((row) => ({
        id: row.id,
        role: row.role === "user" ? "user" : "assistant",
        content: row.content,
        createdAt: row.created_at ?? now(),
        status: "complete" as const,
        toolCalls: [],
      }))
    );
  }, []);

  const runTurn = useCallback(
    async (text: string, assistantId: string, model: string) => {
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`${API_URL}/chat/${conversationId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, model }),
          signal: controller.signal,
        });

        if (res.status === 429) {
          throw new Error(
            "You're sending messages too quickly. Wait a moment and try again."
          );
        }
        if (!res.ok || !res.body) {
          // Deliberately generic — don't surface backend status text / internals.
          throw new Error("The server couldn't handle that request. Try again in a moment.");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";
          for (const chunk of chunks) {
            if (!chunk.startsWith("data: ")) continue;
            const event: StreamEvent = JSON.parse(chunk.slice(6));
            applyEvent(assistantId, event, setMessages);
          }
        }
        finalize(assistantId, setMessages, "complete");
      } catch (err) {
        if (controller.signal.aborted) {
          finalize(assistantId, setMessages, "complete");
        } else {
          const isNetwork = err instanceof TypeError; // fetch failed to reach server
          const message = isNetwork
            ? "Can't reach the server. Check that the backend is running."
            : err instanceof Error
              ? err.message
              : "Something went wrong.";
          applyEvent(assistantId, { type: "error", message }, setMessages);
          finalize(assistantId, setMessages, "error");
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [conversationId]
  );

  const sendMessage = useCallback(
    (text: string, model: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMessage: ChatMessage = {
        id: makeId(),
        role: "user",
        content: trimmed,
        createdAt: now(),
        status: "complete",
        toolCalls: [],
      };
      const assistantId = makeId();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: now(),
        status: "streaming",
        toolCalls: [],
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      void runTurn(trimmed, assistantId, model);
    },
    [isStreaming, runTurn]
  );

  const regenerate = useCallback(
    (model: string) => {
      if (isStreaming) return;
      setMessages((prev) => {
        const lastUser = [...prev].reverse().find((m) => m.role === "user");
        if (!lastUser) return prev;
        // drop everything after the last user message, then queue a fresh turn
        const cutoff = prev.lastIndexOf(lastUser);
        const kept = prev.slice(0, cutoff + 1);
        const assistantId = makeId();
        queueMicrotask(() => void runTurn(lastUser.content, assistantId, model));
        return [
          ...kept,
          {
            id: assistantId,
            role: "assistant",
            content: "",
            createdAt: now(),
            status: "streaming",
            toolCalls: [],
          },
        ];
      });
    },
    [isStreaming, runTurn]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    conversationId,
    isStreaming,
    sendMessage,
    regenerate,
    stop,
    newConversation,
    loadConversation,
  };
}

function finalize(
  assistantId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  status: "complete" | "error"
) {
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id === assistantId
        ? {
            ...msg,
            status,
            toolCalls: msg.toolCalls.map((tc) =>
              tc.status === "running" ? { ...tc, status: "done" as const } : tc
            ),
          }
        : msg
    )
  );
}

function applyEvent(
  assistantId: string,
  event: StreamEvent,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  setMessages((prev) =>
    prev.map((msg) => {
      if (msg.id !== assistantId) return msg;

      switch (event.type) {
        case "content":
          return { ...msg, content: msg.content + event.text };
        case "tool_start": {
          const toolCall: ToolCall = {
            id: makeId(),
            name: event.name,
            args: event.args,
            status: "running",
          };
          return { ...msg, toolCalls: [...msg.toolCalls, toolCall] };
        }
        case "tool_result":
          return {
            ...msg,
            toolCalls: msg.toolCalls.map((tc) =>
              tc.name === event.name && tc.status === "running"
                ? { ...tc, result: event.result, status: "done" as const }
                : tc
            ),
          };
        case "final": {
          // The backend emits `[server error: ...]` as final content on an
          // unhandled exception — replace it so internals aren't shown.
          const leaked = /^\[server error:/i.test(event.content.trimStart());
          return {
            ...msg,
            content: leaked
              ? "⚠ The server hit an error while answering. Try again."
              : event.content,
            status: leaked ? "error" : msg.status,
          };
        }
        case "error": {
          const prefix = msg.content ? `${msg.content}\n\n` : "";
          return { ...msg, content: `${prefix}⚠ ${event.message}`, status: "error" };
        }
        default:
          return msg;
      }
    })
  );
}
