"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { getDefaultAgentId, getDefaultConfig } from "@/lib/agents";
import { getAgentConfig, setAgentConfig } from "@/lib/storage";
import type { Thread, ThreadWithMessages, Message, ApiThread } from "@/lib/types";
import type { AgentConfig } from "@/lib/agents";

interface UseThreadsReturn {
  threads: ThreadWithMessages[];
  selectedThread: ThreadWithMessages | null;
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
  selectThread: (id: string | null) => void;
  createThread: (title?: string) => Promise<ThreadWithMessages | null>;
  addMessage: (threadId: string, message: Message) => void;
  updateThreadTitle: (threadId: string, title: string) => void;
  updateAgentConfig: (threadId: string, key: string, value: unknown) => void;
  updateAgentConfigMultiple: (threadId: string, updates: Partial<AgentConfig>) => void;
  changeAgent: (threadId: string, agentId: string) => void;
  refresh: () => Promise<void>;
}

// Obter config do agente: primeiro tenta do storage, senao usa default
function getStoredOrDefaultConfig(agentId: string): AgentConfig {
  const storedConfig = getAgentConfig<AgentConfig>(agentId);
  if (storedConfig) {
    return storedConfig;
  }
  return getDefaultConfig(agentId);
}

// Converter resposta da API para tipo do frontend
function mapApiThreadToThread(t: ApiThread): ThreadWithMessages {
  const defaultAgentId = getDefaultAgentId();
  return {
    id: t.id,
    title: t.title || "Nova conversa",
    updatedAt: new Date(t.updatedAt),
    messages: [],
    agentId: defaultAgentId,
    agentConfig: getStoredOrDefaultConfig(defaultAgentId),
  };
}

export function useThreads(): UseThreadsReturn {
  const { currentMembership } = useSession();
  const orgId = currentMembership?.organizationId;

  const [threads, setThreads] = useState<ThreadWithMessages[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await api.get<ApiThread[]>(`/organizations/${orgId}/threads`);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setThreads(response.data.map(mapApiThreadToThread));
      }
    } catch (err) {
      console.error("Erro ao carregar threads:", err);
      setError("Erro ao carregar conversas");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const selectedThread = threads.find((t) => t.id === selectedId) ?? null;

  const selectThread = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const createThread = useCallback(
    async (title?: string): Promise<ThreadWithMessages | null> => {
      if (!orgId) {
        return null;
      }

      try {
        const response = await api.post<ApiThread>(
          `/organizations/${orgId}/threads`,
          title ? { title } : {}
        );

        if (response.error || !response.data) {
          console.error("Erro ao criar thread");
          return null;
        }

        const newThread = mapApiThreadToThread(response.data);

        setThreads((prev) => [newThread, ...prev]);
        setSelectedId(newThread.id);

        return newThread;
      } catch (err) {
        console.error("Erro ao criar thread:", err);
        return null;
      }
    },
    [orgId]
  );

  const addMessage = useCallback((threadId: string, message: Message) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === threadId) {
          const isFirstMessage = thread.messages.length === 0;
          return {
            ...thread,
            title: isFirstMessage && message.role === "user"
              ? message.content.slice(0, 30) + (message.content.length > 30 ? "..." : "")
              : thread.title,
            updatedAt: new Date(),
            messages: [...thread.messages, message],
          };
        }
        return thread;
      })
    );
  }, []);

  const updateThreadTitle = useCallback((threadId: string, title: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId ? { ...thread, title } : thread
      )
    );
  }, []);

  const updateAgentConfig = useCallback(
    (threadId: string, key: string, value: unknown) => {
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id === threadId) {
            const newConfig = { ...thread.agentConfig, [key]: value } as AgentConfig;
            // Salva a config no storage para persistir entre sessoes
            setAgentConfig(thread.agentId, newConfig);
            return { ...thread, agentConfig: newConfig };
          }
          return thread;
        })
      );
    },
    []
  );

  const updateAgentConfigMultiple = useCallback(
    (threadId: string, updates: Partial<AgentConfig>) => {
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id === threadId) {
            const newConfig = { ...thread.agentConfig, ...updates } as AgentConfig;
            // Salva a config no storage para persistir entre sessoes
            setAgentConfig(thread.agentId, newConfig);
            return { ...thread, agentConfig: newConfig };
          }
          return thread;
        })
      );
    },
    []
  );

  const changeAgent = useCallback((threadId: string, agentId: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId
          ? {
              ...thread,
              agentId,
              agentConfig: getStoredOrDefaultConfig(agentId),
            }
          : thread
      )
    );
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadThreads();
  }, [loadThreads]);

  return {
    threads,
    selectedThread,
    selectedId,
    isLoading,
    error,
    selectThread,
    createThread,
    addMessage,
    updateThreadTitle,
    updateAgentConfig,
    updateAgentConfigMultiple,
    changeAgent,
    refresh,
  };
}

// Hook para uso na sidebar (threads apenas para navegação)
interface UseSidebarThreadsReturn {
  threads: Thread[];
  isLoading: boolean;
}

export function useSidebarThreads(): UseSidebarThreadsReturn {
  const { currentMembership } = useSession();
  const orgId = currentMembership?.organizationId;

  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadThreads = useCallback(async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get<ApiThread[]>(`/organizations/${orgId}/threads`);

      if (response.error || !response.data) return;

      const loadedThreads: Thread[] = response.data.map((t) => ({
        id: t.id,
        title: t.title || "Nova conversa",
        updatedAt: new Date(t.updatedAt),
      }));

      setThreads(loadedThreads);
    } catch (err) {
      console.error("Erro ao carregar threads:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return {
    threads,
    isLoading,
  };
}
