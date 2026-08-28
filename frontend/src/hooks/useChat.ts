import { useState, useRef, useCallback } from "react";
import type { ChatMessage, StreamEvent, ToolCall } from "../types";

const API_URL = "http://localhost:8000";

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationId = useRef(makeId());

  const newConversation = useCallback(() => {
    conversationId.current = makeId();
    setMessages([]);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    conversationId.current = id;
    const res = await fetch(`${API_URL}/conversations/${id}/messages`);
    if (!res.ok) throw new Error(`request failed (${res.status})`);
    const rows: { id: string; role: string; content: string }[] = await res.json();
    setMessages(
      rows.map((row) => ({
        id: row.id,
        role: row.role === "user" ? "user" : "assistant",
        content: row.content,
        toolCalls: [],
      }))
    );
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text,
      toolCalls: [],
    };

    const assistantId = makeId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      toolCalls: [],
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    try {
      const res = await fetch(`${API_URL}/chat/${conversationId.current}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const event: StreamEvent = JSON.parse(line.slice(6));
          applyEvent(assistantId, event, setMessages);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "something went wrong";
      applyEvent(
        assistantId,
        { type: "error", message },
        setMessages
      );
    } finally {
      // never leave tool traces spinning if the stream ended early
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? {
                ...msg,
                toolCalls: msg.toolCalls.map((tc) =>
                  tc.status === "running" ? { ...tc, status: "done" as const } : tc
                ),
              }
            : msg
        )
      );
      setIsStreaming(false);
    }
  }, []);

  return { messages, sendMessage, isStreaming, newConversation, loadConversation };
}

function applyEvent(
  assistantId: string,
  event: StreamEvent,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  setMessages((prev) =>
    prev.map((msg) => {
      if (msg.id !== assistantId) return msg;

      if (event.type === "content") {
        return { ...msg, content: msg.content + event.text };
      }

      if (event.type === "tool_start") {
        const toolCall: ToolCall = {
          id: makeId(),
          name: event.name,
          args: event.args,
          status: "running",
        };
        return { ...msg, toolCalls: [...msg.toolCalls, toolCall] };
      }

      if (event.type === "tool_result") {
        return {
          ...msg,
          toolCalls: msg.toolCalls.map((tc) =>
            tc.name === event.name && tc.status === "running"
              ? { ...tc, result: event.result, status: "done" as const }
              : tc
          ),
        };
      }

      if (event.type === "final") {
        return { ...msg, content: event.content };
      }

      if (event.type === "error") {
        const prefix = msg.content ? `${msg.content}\n\n` : "";
        return { ...msg, content: `${prefix}⚠ ${event.message}` };
      }

      return msg;
    })
  );
}