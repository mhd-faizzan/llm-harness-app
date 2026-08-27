import type { ChatMessage } from "../types";
import { ToolTrace } from "./ToolTrace";

export function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`message ${isUser ? "message-user" : "message-assistant"}`}>
      {message.toolCalls.length > 0 && (
        <div className="tool-trace-list">
          {message.toolCalls.map((tc) => (
            <ToolTrace key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}
      <div className="message-content">{message.content}</div>
    </div>
  );
}