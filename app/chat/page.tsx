"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/lib/session";
import { useThreads, useModels, useConfigs, useProviders } from "@/lib/hooks";
import { Header, Sidebar, MobileSidebar, MobileThreadsDrawer } from "@/components/layout";
import { ChatArea, ChatSettings, MobileChatSettings } from "@/components/chat";
import { streamRun } from "@/lib/api";
import { generateId } from "@/lib/utils";
import type { Message, ToolKey } from "@/lib/types";

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

  // Hooks para verificar tools disponíveis
  const { getConfig: getToolConfig } = useConfigs("TOOL");
  const { getConfig: getFeatureConfig } = useConfigs("FEATURE");
  const { getProvidersByType } = useProviders();

  // Calcula quais tools estão disponíveis baseado nas configurações e provedores
  const availableTools = useMemo<ToolKey[]>(() => {
    const tools: ToolKey[] = [];

    // WEB_SEARCH: precisa de config habilitada + provider WEB_SEARCH configurado
    const webSearchConfig = getToolConfig("TOOL", "WEB_SEARCH");
    const hasWebSearchProvider = getProvidersByType("WEB_SEARCH").length > 0;
    if (webSearchConfig?.isEnabled && hasWebSearchProvider) {
      tools.push("WEB_SEARCH");
    }

    // WEB_FETCH: precisa de config habilitada + provider WEB_SEARCH configurado (usa Tavily)
    const webFetchConfig = getToolConfig("TOOL", "WEB_FETCH");
    if (webFetchConfig?.isEnabled && hasWebSearchProvider) {
      tools.push("WEB_FETCH");
    }

    // KNOWLEDGE: precisa de config habilitada + provider EMBEDDING configurado
    // Nota: KNOWLEDGE usa config FEATURE pois tem pagina de configuracao separada
    const knowledgeConfig = getFeatureConfig("FEATURE", "KNOWLEDGE");
    const hasEmbeddingProvider = getProvidersByType("EMBEDDING").length > 0;
    if (knowledgeConfig?.isEnabled && hasEmbeddingProvider) {
      tools.push("KNOWLEDGE");
    }

    return tools;
  }, [getToolConfig, getFeatureConfig, getProvidersByType]);

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
        router.push("/auth/login");
      } else if (!hasOrganization) {
        router.push("/chat/onboarding");
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
    const { error } = await createThread();
    if (error) {
      toast.error(error);
    }
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

  const handleToolToggle = useCallback(
    (tool: ToolKey, enabled: boolean) => {
      if (!selectedThread) return;
      const currentTools = selectedThread.config.enabledTools;
      const newTools = enabled
        ? [...currentTools, tool]
        : currentTools.filter((t) => t !== tool);
      updateConfig(selectedId!, "enabledTools", newTools);
    },
    [selectedThread, selectedId, updateConfig]
  );

  const streamRunForThread = useCallback(
    async (threadId: string, messageContent: string) => {
      const thread = threads.find((t) => t.id === threadId);
      if (!thread || !currentMembership) return;

      const config = thread.config;

      // Verifica se tem provedor e modelo configurados
      if (!config.provider || !config.model) {
        const assistantMessage: Message = {
          id: generateId(),
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
          enabledTools: config.enabledTools,
        },
      };

      const streamingMessageId = generateId();
      const initialContent = "_Pensando..._";
      let streamingContent = "";

      // Cria mensagem com placeholder inicial
      const streamingMessage: Message = {
        id: streamingMessageId,
        role: "assistant",
        content: initialContent,
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
          onStatus: (status) => {
            // Mostra status apenas se ainda nao tem conteudo
            if (!streamingContent && status) {
              updateMessage(threadId, streamingMessageId, `_${status}_`);
            }
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
    },
    [threads, currentMembership, addMessage, updateMessage]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedId) {
        // Criar nova thread quando nao houver thread selecionada
        const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
        const { thread: newThread, error } = await createThread(title);

        if (error) {
          toast.error(error);
          return;
        }

        if (newThread) {
          const userMessage: Message = {
            id: generateId(),
            role: "user",
            content,
            createdAt: new Date(),
          };
          addMessage(newThread.id, userMessage);
          streamRunForThread(newThread.id, content);
        }
        return;
      }

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        createdAt: new Date(),
      };

      addMessage(selectedId, userMessage);
      streamRunForThread(selectedId, content);
    },
    [selectedId, createThread, addMessage, streamRunForThread]
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
              onToolToggle={handleToolToggle}
              availableTools={availableTools}
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
          onToolToggle={handleToolToggle}
          availableTools={availableTools}
          open={mobileSettingsOpen}
          onOpenChange={setMobileSettingsOpen}
        />
      )}
    </div>
  );
}
