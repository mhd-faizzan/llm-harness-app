import type { ChatMessage } from "../types";
import { ToolTrace } from "./ToolTrace";
import { Markdown } from "./Markdown";

export function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`message ${isUser ? "message-user" : "message-assistant"}`}>
      <div className="message-role">{isUser ? "You" : "Harness"}</div>
      <div className="message-body">
        {message.toolCalls.length > 0 && (
          <div className="tool-trace-list">
            {message.toolCalls.map((tc) => (
              <ToolTrace key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}
        {message.content ? (
          isUser ? (
            <div className="message-content">{message.content}</div>
          ) : (
            <div className="message-content">
              <Markdown>{message.content}</Markdown>
            </div>
          )
        ) : (
          !isUser && <div className="message-typing"><span /><span /><span /></div>
        )}
      </div>
    </div>
  );
}
