import { useCallback, useEffect, useMemo, useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useTheme } from "@/hooks/useTheme";
import { useSidebar } from "@/hooks/useSidebar";
import { useConversations } from "@/hooks/useConversations";
import { DEFAULT_MODEL_ID } from "@/lib/models";
import { getTitleOverride, setTitleOverride } from "@/lib/titles";
import { Sidebar } from "@/components/chat/Sidebar";
import { Header } from "@/components/chat/Header";
import { MessageList } from "@/components/chat/MessageList";
import { Composer } from "@/components/chat/Composer";

const MODEL_KEY = "harness-model";

function readModel() {
  try {
    return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL_ID;
  } catch {
    return DEFAULT_MODEL_ID;
  }
}

export default function App() {
  const {
    messages,
    conversationId,
    isStreaming,
    sendMessage,
    regenerate,
    stop,
    newConversation,
    loadConversation,
  } = useChat();
  const { theme, toggleTheme } = useTheme();
  const sidebar = useSidebar();
  const { conversations, status, refresh } = useConversations();

  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [model, setModel] = useState(readModel);

  useEffect(() => {
    try {
      localStorage.setItem(MODEL_KEY, model);
    } catch {
      // ignore
    }
  }, [model]);

  // When a turn finishes, the backend may have created the conversation.
  useEffect(() => {
    if (isStreaming) return;
    if (messages.length > 0) setActiveId(conversationId);
    void refresh();
  }, [isStreaming, messages.length, conversationId, refresh]);

  const handleSelect = useCallback(
    async (id: string) => {
      setActiveId(id);
      sidebar.closeDrawer();
      try {
        await loadConversation(id);
      } catch {
        setActiveId(undefined);
      }
    },
    [loadConversation, sidebar]
  );

  const handleNew = useCallback(() => {
    newConversation();
    setActiveId(undefined);
    sidebar.closeDrawer();
  }, [newConversation, sidebar]);

  const handleSend = useCallback(
    (text: string) => sendMessage(text, model),
    [sendMessage, model]
  );
  const handleRegenerate = useCallback(
    () => regenerate(model),
    [regenerate, model]
  );

  const activeConversation = conversations.find((c) => c.id === activeId);
  const title = useMemo(() => {
    if (!activeId) return "New chat";
    return (
      getTitleOverride(activeId) || activeConversation?.title || "New chat"
    );
  }, [activeId, activeConversation]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <a
        href="#composer"
        className="sr-only left-3 top-3 z-[60] rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute"
      >
        Skip to message input
      </a>
      <Sidebar
        conversations={conversations}
        status={status}
        activeId={activeId}
        collapsed={sidebar.collapsed}
        isMobile={sidebar.isMobile}
        drawerOpen={sidebar.drawerOpen}
        onSelect={handleSelect}
        onNew={handleNew}
        onToggleCollapsed={sidebar.toggleCollapsed}
        onCloseDrawer={sidebar.closeDrawer}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          title={title}
          canEditTitle={Boolean(activeId)}
          onRename={(next) => activeId && setTitleOverride(activeId, next)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onMenuClick={sidebar.openDrawer}
          onToggleSidebar={sidebar.toggleCollapsed}
          onNewChat={handleNew}
          sidebarCollapsed={sidebar.collapsed}
          isMobile={sidebar.isMobile}
        />

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4">
            <div className="w-full max-w-3xl">
              <div className="mb-8 text-center">
                <h1 className="text-[26px] font-semibold tracking-tight">
                  What do you want to check?
                </h1>
                <p className="mt-3 text-[14px] text-foreground/50">
                  Ask something that needs verifying, not guessing.
                </p>
              </div>
              <Composer
                onSend={handleSend}
                onStop={stop}
                isStreaming={isStreaming}
                model={model}
                onModelChange={setModel}
              />
            </div>
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              isStreaming={isStreaming}
              onRegenerate={handleRegenerate}
            />
            <Composer
              onSend={handleSend}
              onStop={stop}
              isStreaming={isStreaming}
              model={model}
              onModelChange={setModel}
            />
          </>
        )}
      </div>
    </div>
  );
}
