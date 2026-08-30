export type Role = "user" | "assistant" | "system" | "tool";

export type MessageStatus = "streaming" | "complete" | "error";

export type ToolCallStatus = "running" | "done";

export interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  result?: string;
  status: ToolCallStatus;
}

export interface ChatMessage {
  id: string;
  role: Extract<Role, "user" | "assistant">;
  content: string;
  createdAt: string;
  status?: MessageStatus;
  toolCalls: ToolCall[];
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

/** Server-sent events emitted by the harness loop. */
export type StreamEvent =
  | { type: "content"; text: string }
  | { type: "tool_start"; name: string; args: Record<string, unknown> }
  | { type: "tool_result"; name: string; result: string }
  | { type: "final"; content: string }
  | { type: "error"; message: string };

export interface ModelOption {
  id: string;
  label: string;
  description: string;
  provider: "claude" | "openai" | "groq";
}
