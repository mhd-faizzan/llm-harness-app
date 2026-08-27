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

    const res = await fetch(`${API_URL}/chat/${conversationId.current}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    if (!reader) {
      setIsStreaming(false);
      return;
    }

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

    setIsStreaming(false);
  }, []);

  return { messages, sendMessage, isStreaming };
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

      return msg;
    })
  );
}