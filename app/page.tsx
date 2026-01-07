"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Header } from "@/components/header";
import { Sidebar, MobileSidebar, MobileThreadsDrawer, type Thread } from "@/components/sidebar";
import { ChatArea, type Message } from "@/components/chat-area";
import { ChatSettings, MobileChatSettings, type SystemPrompt, type ModelOption } from "@/components/chat-settings";
import { getDefaultAgentId, getDefaultConfig } from "@/lib/agents";
import type { AgentConfig } from "@/lib/agents";

interface ThreadWithMessages extends Thread {
  messages: Message[];
  agentId: string;
  agentConfig: AgentConfig;
}

// Tipo da resposta da API de threads
interface ApiThread {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    user: {
      id: string;
      name: string;
    };
  };
}

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading, hasOrganization, currentMembership } = useAuth();
  const orgId = currentMembership?.organizationId;
  const [threads, setThreads] = useState<ThreadWithMessages[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);

  // Carregar threads da API
  const loadThreads = useCallback(async () => {
    if (!orgId) return;

    try {
      const response = await api.get<ApiThread[]>(
        `/organizations/${orgId}/threads`
      );
      if (response.error || !response.data) return;

      const defaultAgentId = getDefaultAgentId();
      const loadedThreads: ThreadWithMessages[] = response.data.map((t) => ({
        id: t.id,
        title: t.title || "Nova conversa",
        updatedAt: new Date(t.updatedAt),
        messages: [],
        agentId: defaultAgentId,
        agentConfig: getDefaultConfig(defaultAgentId),
      }));

      setThreads(loadedThreads);
    } catch (error) {
      console.error("Erro ao carregar threads:", error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [orgId]);

  // Carregar prompts da API
  const loadPrompts = useCallback(async () => {
    if (!orgId) return;

    try {
      const response = await api.get<
        { id: string; name: string; content: string; role: string }[]
      >(`/organizations/${orgId}/prompts`);
      if (response.error || !response.data) return;

      // Filtrar apenas prompts com role SYSTEM
      const prompts: SystemPrompt[] = response.data
        .filter((p) => p.role === "SYSTEM")
        .map((p) => ({
          id: p.id,
          name: p.name,
          content: p.content,
        }));

      setSystemPrompts(prompts);
    } catch (error) {
      console.error("Erro ao carregar prompts:", error);
    }
  }, [orgId]);

  // Carregar modelos disponiveis da API
  const loadModels = useCallback(async (provider?: string) => {
    if (!orgId) return;

    try {
      const url = provider
        ? `/organizations/${orgId}/models?provider=${provider}`
        : `/organizations/${orgId}/models`;
      const response = await api.get<{
        models: ModelOption[];
        selectedProvider: string | null;
        configuredProviders: string[];
      }>(url);
      if (response.error || !response.data) return;

      setAvailableModels(response.data.models || []);
      setSelectedProvider(response.data.selectedProvider || null);
      setConfiguredProviders(response.data.configuredProviders || []);
    } catch (error) {
      console.error("Erro ao carregar modelos:", error);
    }
  }, [orgId]);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        router.push("/login");
      } else if (!hasOrganization) {
        router.push("/onboarding");
      } else {
        loadThreads();
        loadPrompts();
        loadModels();
      }
    }
  }, [isLoading, isLoggedIn, hasOrganization, router, loadThreads, loadPrompts, loadModels]);

  const selectedThread = threads.find((t) => t.id === selectedId);

  const handleNewChat = async () => {
    if (!orgId) return;

    try {
      const response = await api.post<ApiThread>(
        `/organizations/${orgId}/threads`,
        {}
      );

      if (response.error || !response.data) {
        console.error("Erro ao criar thread");
        return;
      }

      const defaultAgentId = getDefaultAgentId();
      const newThread: ThreadWithMessages = {
        id: response.data.id,
        title: response.data.title || "Nova conversa",
        updatedAt: new Date(response.data.updatedAt),
        messages: [],
        agentId: defaultAgentId,
        agentConfig: getDefaultConfig(defaultAgentId),
      };

      setThreads((prev) => [newThread, ...prev]);
      setSelectedId(newThread.id);
    } catch (error) {
      console.error("Erro ao criar thread:", error);
    }
  };

  const handleAgentChange = (agentId: string) => {
    if (!selectedId) return;
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedId
          ? { ...thread, agentId, agentConfig: getDefaultConfig(agentId) }
          : thread
      )
    );
  };

  const handleAgentConfigChange = (key: string, value: unknown) => {
    if (!selectedId) return;
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedId
          ? {
              ...thread,
              agentConfig: { ...thread.agentConfig, [key]: value },
            }
          : thread
      )
    );
  };

  const handleProviderChange = (provider: string) => {
    // Recarregar modelos para o novo provedor
    loadModels(provider);
    // Limpar modelo selecionado na thread atual quando muda o provedor
    if (selectedId) {
      handleAgentConfigChange("model", "");
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedId) {
      // Criar thread via API quando nao houver thread selecionada
      if (!orgId) return;

      try {
        const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
        const response = await api.post<ApiThread>(
          `/organizations/${orgId}/threads`,
          { title }
        );

        if (response.error || !response.data) {
          console.error("Erro ao criar thread");
          return;
        }

        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content,
          createdAt: new Date(),
        };

        const defaultAgentId = getDefaultAgentId();
        const newThread: ThreadWithMessages = {
          id: response.data.id,
          title: response.data.title || title,
          updatedAt: new Date(response.data.updatedAt),
          messages: [userMessage],
          agentId: defaultAgentId,
          agentConfig: getDefaultConfig(defaultAgentId),
        };

        setThreads((prev) => [newThread, ...prev]);
        setSelectedId(newThread.id);
        simulateResponse(newThread.id);
      } catch (error) {
        console.error("Erro ao criar thread:", error);
      }
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === selectedId) {
          const isFirstMessage = thread.messages.length === 0;
          return {
            ...thread,
            title: isFirstMessage
              ? content.slice(0, 30) + (content.length > 30 ? "..." : "")
              : thread.title,
            updatedAt: new Date(),
            messages: [...thread.messages, userMessage],
          };
        }
        return thread;
      })
    );

    simulateResponse(selectedId);
  };

  const simulateResponse = (threadId: string) => {
    setTimeout(() => {
      const thread = threads.find((t) => t.id === threadId);
      const modelName = (thread?.agentConfig as Record<string, unknown>)?.model as string ?? "IA";

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Resposta simulada usando ${modelName || "agente"}. Em breve, será integrado com o agente de IA.`,
        createdAt: new Date(),
      };

      setThreads((prev) =>
        prev.map((t) => {
          if (t.id === threadId) {
            return {
              ...t,
              messages: [...t.messages, assistantMessage],
            };
          }
          return t;
        })
      );
    }, 1000);
  };

  if (isLoading || isLoadingThreads || !isLoggedIn || !hasOrganization) {
    return null;
  }

  const sidebarProps = {
    threads,
    selectedId,
    onSelect: setSelectedId,
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
        onSelect={setSelectedId}
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
