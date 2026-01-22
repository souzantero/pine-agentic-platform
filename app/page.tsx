"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useThreads, useModels } from "@/lib/hooks";
import { Header, Sidebar, MobileSidebar, MobileThreadsDrawer } from "@/components/layout";
import { ChatArea, ChatSettings, MobileChatSettings } from "@/components/chat";
import { invokeRun, streamRun } from "@/lib/api";
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
    updateMessage,
    updateConfig,
    updateConfigMultiple,
  } = useThreads();

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
  const [settingsExpanded, setSettingsExpanded] = useState(false);
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

    const config = selectedThread.config;
    if (config.provider) {
      // Provider ja configurado, carregar modelos apenas se ainda nao carregados
      if (modelsProvider !== config.provider) {
        loadModelsForProvider(config.provider);
      }
    } else {
      // Sem provider, auto-selecionar primeiro disponivel
      const defaultProvider = configuredProviders[0];
      updateConfigMultiple(selectedThread.id, { provider: defaultProvider });
      if (modelsProvider !== defaultProvider) {
        loadModelsForProvider(defaultProvider);
      }
    }
  }, [selectedThread, configuredProviders, modelsProvider, updateConfigMultiple, loadModelsForProvider]);

  // Auto-selecionar primeiro modelo quando modelos sao carregados e nao ha modelo configurado
  useEffect(() => {
    if (!selectedThread || availableModels.length === 0) return;

    const config = selectedThread.config;
    // So auto-seleciona se os modelos sao do mesmo provider da thread
    if (!config.model && modelsProvider === config.provider) {
      updateConfigMultiple(selectedThread.id, { model: availableModels[0].id });
    }
  }, [selectedThread, availableModels, modelsProvider, updateConfigMultiple]);

  const handleNewChat = useCallback(async () => {
    await createThread();
  }, [createThread]);

  const handleConfigChange = useCallback(
    (key: string, value: unknown) => {
      if (!selectedId) return;
      updateConfig(selectedId, key, value);
    },
    [selectedId, updateConfig]
  );

  const handleProviderChange = useCallback(
    (provider: string) => {
      // Recarregar modelos para o novo provedor
      loadModelsForProvider(provider);
      // Atualizar provider e limpar modelo em uma unica operacao
      if (selectedId) {
        updateConfigMultiple(selectedId, { provider, model: "" });
      }
    },
    [loadModelsForProvider, selectedId, updateConfigMultiple]
  );

  const invokeRunForThread = useCallback(
    async (threadId: string, messageContent: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread || !currentMembership) return;

      const config = thread.config;

      // Verifica se tem provedor e modelo configurados
      if (!config.provider || !config.model) {
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

      const payload = {
        input: {
          messages: [{ content: messageContent }],
        },
        config: {
          provider: config.provider,
          model: config.model,
        },
      };

      // Modo streaming
      if (config.streamMode) {
        const streamingMessageId = crypto.randomUUID();
        let streamingContent = "";

        // Cria mensagem vazia para ir preenchendo
        const streamingMessage: Message = {
          id: streamingMessageId,
          role: "assistant",
          content: "",
          createdAt: new Date(),
        };
        addMessage(threadId, streamingMessage);

        await streamRun(
          currentMembership.organizationId,
          threadId,
          payload,
          {
            onChunk: (content) => {
              streamingContent += content;
              updateMessage(threadId, streamingMessageId, streamingContent);
            },
            onFinal: (messages) => {
              // Pega a ultima mensagem do tipo "ai" sem toolCalls
              const aiMessages = messages.filter(
                (m) => m.type === "ai" && (!m.toolCalls || m.toolCalls.length === 0)
              );
              const lastAiMessage = aiMessages[aiMessages.length - 1];
              if (lastAiMessage) {
                updateMessage(threadId, streamingMessageId, lastAiMessage.content);
              }
              setIsInvoking(false);
            },
            onError: (error) => {
              updateMessage(threadId, streamingMessageId, `Erro: ${error}`);
              setIsInvoking(false);
            },
          }
        );
        return;
      }

      // Modo invoke (padrao)
      try {
        const response = await invokeRun(
          currentMembership.organizationId,
          threadId,
          payload
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

        // Pega a ultima mensagem do tipo "ai" sem toolCalls da resposta
        const aiMessages = response.data?.messages.filter(
          (m) => m.type === "ai" && (!m.toolCalls || m.toolCalls.length === 0)
        ) ?? [];
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
        console.error("Erro ao invocar execucao:", error);
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
    [threads, currentMembership, addMessage, updateMessage]
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
          invokeRunForThread(newThread.id, content);
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
      invokeRunForThread(selectedId, content);
    },
    [selectedId, createThread, addMessage, invokeRunForThread]
  );

  const isLoading = authLoading || threadsLoading;

  if (isLoading || !isLoggedIn || !hasOrganization) {
    return null;
  }

  const hasProviders = configuredProviders.length > 0;

  const sidebarProps = {
    threads,
    selectedId,
    onSelect: selectThread,
    onNewChat: handleNewChat,
    hasProviders,
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
        onSettingsClick={() => setMobileSettingsOpen(true)}
      />

      {/* Mobile Threads Drawer */}
      <MobileThreadsDrawer
        threads={threads}
        selectedId={selectedId}
        onSelect={selectThread}
        onNewChat={handleNewChat}
        open={mobileThreadsOpen}
        onOpenChange={setMobileThreadsOpen}
        hasProviders={hasProviders}
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
          />
        </main>

        {/* Settings Panel - Desktop only */}
        {selectedThread && (
          <div className="hidden lg:flex h-full">
            <ChatSettings
              config={selectedThread.config}
              onConfigChange={handleConfigChange}
              availableModels={availableModels}
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
          config={selectedThread.config}
          onConfigChange={handleConfigChange}
          availableModels={availableModels}
          configuredProviders={configuredProviders}
          onProviderChange={handleProviderChange}
          open={mobileSettingsOpen}
          onOpenChange={setMobileSettingsOpen}
        />
      )}
    </div>
  );
}
