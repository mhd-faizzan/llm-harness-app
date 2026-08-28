import { useRef, useEffect } from "react";
import { useChat } from "./hooks/useChat";
import { useTheme } from "./hooks/useTheme";
import { Message } from "./components/Message";
import { ChatInput } from "./components/ChatInput";
import { ThemeToggle } from "./components/ThemeToggle";

function App() {
  const { messages, sendMessage, isStreaming } = useChat();
  const { theme, toggleTheme } = useTheme();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-title">harness</span>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </header>

      <main className={`chat${isEmpty ? " chat-empty" : ""}`}>
        {isEmpty ? (
          <div className="empty-state">
            <h1>What do you want to check?</h1>
            <p>Ask me something that needs verifying, not guessing.</p>
          </div>
        ) : (
          <div className="chat-thread">
            {messages.map((msg) => (
              <Message key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      <div className="composer">
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
        <p className="composer-hint">Grounded in real tools. Responses can still be wrong.</p>
      </div>
    </div>
  );
}

export default App;
