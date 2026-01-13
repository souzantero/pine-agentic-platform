"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useThreads, usePrompts, useModels } from "@/lib/hooks";
import { Header, Sidebar, MobileSidebar, MobileThreadsDrawer } from "@/components/layout";
import { ChatArea, ChatSettings, MobileChatSettings } from "@/components/chat";
import { getDefaultAgentId } from "@/lib/agents";
import { invokeAgent } from "@/lib/api";
import type { BasicAgentConfig } from "@/lib/agents";
import type { Message } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, hasOrganization, currentMembership } = useSession();

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
    updateAgentConfigMultiple,
    changeAgent,
  } = useThreads();

  const { systemPrompts } = usePrompts();

  const {
    models: availableModels,
    modelsProvider,
    configuredProviders,
    loadModelsForProvider,
  } = useModels();

  // Estados de UI
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [isInvoking, setIsInvoking] = useState(false);

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

  // Carregar modelos do provider configurado ou auto-selecionar primeiro disponivel
  useEffect(() => {
    if (!selectedThread || configuredProviders.length === 0) return;

    const agentConfig = selectedThread.agentConfig as BasicAgentConfig;
    if (agentConfig.provider) {
      // Provider ja configurado (do storage), carregar modelos compativeis
      loadModelsForProvider(agentConfig.provider);
    } else {
      // Sem provider, auto-selecionar primeiro disponivel
      const defaultProvider = configuredProviders[0];
      updateAgentConfigMultiple(selectedThread.id, { provider: defaultProvider });
      loadModelsForProvider(defaultProvider);
    }
  }, [selectedThread?.id, configuredProviders, updateAgentConfigMultiple, loadModelsForProvider]);

  // Auto-selecionar primeiro modelo quando modelos sao carregados e nao ha modelo configurado
  useEffect(() => {
    if (!selectedThread || availableModels.length === 0) return;

    const agentConfig = selectedThread.agentConfig as BasicAgentConfig;
    // So auto-seleciona se os modelos sao do mesmo provider da thread
    if (!agentConfig.model && modelsProvider === agentConfig.provider) {
      updateAgentConfigMultiple(selectedThread.id, { model: availableModels[0].id });
    }
  }, [selectedThread?.id, availableModels, modelsProvider, updateAgentConfigMultiple]);

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
      // Atualizar provider e limpar modelo em uma unica operacao
      if (selectedId) {
        updateAgentConfigMultiple(selectedId, { provider, model: "" });
      }
    },
    [loadModelsForProvider, selectedId, updateAgentConfigMultiple]
  );

  const invokeAgentForThread = useCallback(
    async (threadId: string, messageContent: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread || !currentMembership) return;

      const agentConfig = thread.agentConfig as BasicAgentConfig;

      // Verifica se tem provedor e modelo configurados
      if (!agentConfig.provider || !agentConfig.model) {
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Por favor, configure um provedor e modelo nas configuracoes para continuar.",
          createdAt: new Date(),
        };
        addMessage(threadId, assistantMessage);
        return;
      }

      setIsInvoking(true);

      try {
        const response = await invokeAgent(
          currentMembership.organizationId,
          threadId,
          thread.agentId,
          {
            input: {
              messages: [{ content: messageContent }],
            },
            config: {
              provider: agentConfig.provider,
              model: agentConfig.model,
              temperature: agentConfig.temperature,
              systemPromptId: agentConfig.systemPromptId,
            },
          }
        );

        if (response.error) {
          const errorMessage: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Erro ao processar mensagem: ${response.error}`,
            createdAt: new Date(),
          };
          addMessage(threadId, errorMessage);
          return;
        }

        // Pega a ultima mensagem do tipo "ai" da resposta
        const aiMessages = response.data?.messages.filter((m) => m.type === "ai") ?? [];
        const lastAiMessage = aiMessages[aiMessages.length - 1];

        if (lastAiMessage) {
          const assistantMessage: Message = {
            id: lastAiMessage.id || crypto.randomUUID(),
            role: "assistant",
            content: lastAiMessage.content,
            createdAt: new Date(),
          };
          addMessage(threadId, assistantMessage);
        }
      } catch (error) {
        console.error("Erro ao invocar agente:", error);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Erro ao conectar com o servidor. Tente novamente.",
          createdAt: new Date(),
        };
        addMessage(threadId, errorMessage);
      } finally {
        setIsInvoking(false);
      }
    },
    [threads, currentMembership, addMessage]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedId) {
        // Criar nova thread quando nao houver thread selecionada
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
          invokeAgentForThread(newThread.id, content);
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
      invokeAgentForThread(selectedId, content);
    },
    [selectedId, createThread, addMessage, invokeAgentForThread]
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
            isLoading={isInvoking}
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
          configuredProviders={configuredProviders}
          onProviderChange={handleProviderChange}
          open={mobileSettingsOpen}
          onOpenChange={setMobileSettingsOpen}
        />
      )}
    </div>
  );
}
