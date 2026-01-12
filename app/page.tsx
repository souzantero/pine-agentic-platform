"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useThreads, usePrompts, useModels } from "@/lib/hooks";
import { Header } from "@/components/header";
import { Sidebar, MobileSidebar, MobileThreadsDrawer } from "@/components/sidebar";
import { ChatArea } from "@/components/chat-area";
import { ChatSettings, MobileChatSettings } from "@/components/chat-settings";
import { getDefaultAgentId } from "@/lib/agents";
import type { Message } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, hasOrganization } = useSession();

  // Hooks
  const {
    threads,
    selectedThread,
    selectedId,
    isLoading: threadsLoading,
    selectThread,
    createThread,
    addMessage,
    updateAgentConfig,
    changeAgent,
  } = useThreads();

  const { systemPrompts } = usePrompts();

  const {
    models: availableModels,
    selectedProvider,
    configuredProviders,
    loadModelsForProvider,
  } = useModels();

  // Estados de UI
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  // Redirect se não autenticado
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push("/login");
      } else if (!hasOrganization) {
        router.push("/onboarding");
      }
    }
  }, [authLoading, isLoggedIn, hasOrganization, router]);

  const handleNewChat = useCallback(async () => {
    await createThread();
  }, [createThread]);

  const handleAgentChange = useCallback(
    (agentId: string) => {
      if (!selectedId) return;
      changeAgent(selectedId, agentId);
    },
    [selectedId, changeAgent]
  );

  const handleAgentConfigChange = useCallback(
    (key: string, value: unknown) => {
      if (!selectedId) return;
      updateAgentConfig(selectedId, key, value);
    },
    [selectedId, updateAgentConfig]
  );

  const handleProviderChange = useCallback(
    (provider: string) => {
      // Recarregar modelos para o novo provedor
      loadModelsForProvider(provider);
      // Limpar modelo selecionado na thread atual quando muda o provedor
      if (selectedId) {
        updateAgentConfig(selectedId, "model", "");
      }
    },
    [loadModelsForProvider, selectedId, updateAgentConfig]
  );

  const simulateResponse = useCallback(
    (threadId: string) => {
      setTimeout(() => {
        const thread = threads.find((t) => t.id === threadId);
        const modelName = (thread?.agentConfig as Record<string, unknown>)?.model as string ?? "IA";

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Resposta simulada usando ${modelName || "agente"}. Em breve, será integrado com o agente de IA.`,
          createdAt: new Date(),
        };

        addMessage(threadId, assistantMessage);
      }, 1000);
    },
    [threads, addMessage]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedId) {
        // Criar nova thread quando não houver thread selecionada
        const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
        const newThread = await createThread(title);

        if (newThread) {
          const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content,
            createdAt: new Date(),
          };
          addMessage(newThread.id, userMessage);
          simulateResponse(newThread.id);
        }
        return;
      }

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date(),
      };

      addMessage(selectedId, userMessage);
      simulateResponse(selectedId);
    },
    [selectedId, createThread, addMessage, simulateResponse]
  );

  const isLoading = authLoading || threadsLoading;

  if (isLoading || !isLoggedIn || !hasOrganization) {
    return null;
  }

  const sidebarProps = {
    threads,
    selectedId,
    onSelect: selectThread,
    onNewChat: handleNewChat,
  };

  return (
    <div className="h-screen flex flex-col">
      <Header
        onMenuClick={() => setMobileMenuOpen(true)}
        onSettingsClick={() => setMobileSettingsOpen(true)}
        showSettingsButton={!!selectedThread}
      />

      {/* Mobile Menu */}
      <MobileSidebar
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        onThreadsClick={() => setMobileThreadsOpen(true)}
      />

      {/* Mobile Threads Drawer */}
      <MobileThreadsDrawer
        threads={threads}
        selectedId={selectedId}
        onSelect={selectThread}
        onNewChat={handleNewChat}
        open={mobileThreadsOpen}
        onOpenChange={setMobileThreadsOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar {...sidebarProps} />

        <main className="flex-1 overflow-hidden">
          <ChatArea
            messages={selectedThread?.messages ?? []}
            onSendMessage={handleSendMessage}
            disabled={!selectedThread}
            selectedAgentId={selectedThread?.agentId ?? getDefaultAgentId()}
            onAgentChange={handleAgentChange}
          />
        </main>

        {/* Settings Panel - Desktop only */}
        {selectedThread && (
          <div className="hidden lg:flex h-full">
            <ChatSettings
              agentId={selectedThread.agentId}
              agentConfig={selectedThread.agentConfig as Record<string, unknown>}
              onConfigChange={handleAgentConfigChange}
              availableModels={availableModels}
              systemPrompts={systemPrompts}
              selectedProvider={selectedProvider}
              configuredProviders={configuredProviders}
              onProviderChange={handleProviderChange}
              expanded={settingsExpanded}
              onExpandedChange={setSettingsExpanded}
            />
          </div>
        )}
      </div>

      {/* Mobile Settings */}
      {selectedThread && (
        <MobileChatSettings
          agentId={selectedThread.agentId}
          agentConfig={selectedThread.agentConfig as Record<string, unknown>}
          onConfigChange={handleAgentConfigChange}
          availableModels={availableModels}
          systemPrompts={systemPrompts}
          selectedProvider={selectedProvider}
          configuredProviders={configuredProviders}
          onProviderChange={handleProviderChange}
          open={mobileSettingsOpen}
          onOpenChange={setMobileSettingsOpen}
        />
      )}
    </div>
  );
}
