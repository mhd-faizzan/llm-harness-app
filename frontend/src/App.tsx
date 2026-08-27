import { useRef, useEffect } from "react";
import { useChat } from "./hooks/useChat";
import { Message } from "./components/Message";
import { ChatInput } from "./components/ChatInput";

function App() {
  const { messages, sendMessage, isStreaming } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="app">
      <div className="chat-window">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>ask me something that needs checking, not guessing</p>
          </div>
        )}
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}

export default App;