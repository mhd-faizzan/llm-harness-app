import { useRef, useEffect, useState } from "react";
import { useChat } from "./hooks/useChat";
import { useTheme } from "./hooks/useTheme";
import { Message } from "./components/Message";
import { ChatInput } from "./components/ChatInput";
import { ThemeToggle } from "./components/ThemeToggle";
import { Sidebar } from "./components/Sidebar";

function App() {
  const { messages, sendMessage, isStreaming, newConversation, loadConversation } = useChat();
  const { theme, toggleTheme } = useTheme();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // refresh the conversation list once a turn finishes (a new chat may have been created)
  useEffect(() => {
    if (!isStreaming) setRefreshKey((k) => k + 1);
  }, [isStreaming]);

  const handleSelect = async (id: string) => {
    setActiveId(id);
    try {
      await loadConversation(id);
    } catch {
      setActiveId(undefined);
    }
  };

  const handleNew = () => {
    newConversation();
    setActiveId(undefined);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="app">
      <Sidebar
        activeId={activeId}
        refreshKey={refreshKey}
        onSelect={handleSelect}
        onNew={handleNew}
      />
      <div className="app-main">
        <header className="app-header">
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
    </div>
  );
}

export default App;
