"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "@/lib/session";
import { api, getThreadMessages } from "@/lib/api";
import { getThreadConfig, setThreadConfig } from "@/lib/storage";
import type {
  Thread,
  ThreadWithMessages,
  Message,
  ChatConfig,
  ApiThread,
  AgentMessage,
} from "@/lib/types";

interface UseThreadsReturn {
  threads: ThreadWithMessages[];
  selectedThread: ThreadWithMessages | null;
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
  selectThread: (id: string | null) => void;
  createThread: (title?: string) => Promise<ThreadWithMessages | null>;
  addMessage: (threadId: string, message: Message) => void;
  updateMessage: (threadId: string, messageId: string, content: string) => void;
  updateThreadTitle: (threadId: string, title: string) => void;
  updateConfig: (threadId: string, key: string, value: unknown) => void;
  updateConfigMultiple: (threadId: string, updates: Partial<ChatConfig>) => void;
  refresh: () => Promise<void>;
}

// Config padrao
const DEFAULT_CONFIG: ChatConfig = {
  provider: null,
  model: "",
  streamMode: false,
};

// Obter config: primeiro tenta do storage da thread, senao usa default
function getStoredOrDefaultConfig(threadId: string): ChatConfig {
  const storedConfig = getThreadConfig<ChatConfig>(threadId);
  if (storedConfig) {
    return storedConfig;
  }
  return { ...DEFAULT_CONFIG };
}

// Converter mensagem do agente para mensagem do frontend
function mapAgentMessageToMessage(m: AgentMessage): Message {
  return {
    id: m.id,
    role: m.type === "human" ? "user" : "assistant",
    content: m.content,
    createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
  };
}

// Converter resposta da API para tipo do frontend
function mapApiThreadToThread(t: ApiThread): ThreadWithMessages {
  // Usa lastMessagePreview como titulo se title estiver vazio
  const displayTitle = t.title || t.lastMessagePreview || "Nova conversa";
  return {
    id: t.id,
    title: displayTitle,
    updatedAt: t.lastMessageAt ? new Date(t.lastMessageAt) : new Date(t.updatedAt),
    messages: [],
    config: getStoredOrDefaultConfig(t.id),
  };
}

export function useThreads(): UseThreadsReturn {
  const { currentMembership } = useSession();
  const orgId = currentMembership?.organizationId;

  const [threads, setThreads] = useState<ThreadWithMessages[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedThreadsRef = useRef<Set<string>>(new Set());

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

  // Carregar mensagens ao selecionar uma thread
  useEffect(() => {
    if (!selectedId || !orgId) return;
    if (loadedThreadsRef.current.has(selectedId)) return;

    const loadMessages = async () => {
      const response = await getThreadMessages(orgId, selectedId);
      if (response.error || !response.data) return;

      // Filtra apenas mensagens human e ai (ignora tool e mensagens com toolCalls)
      const messages = response.data.messages
        .filter((m) =>
          (m.type === "human" || m.type === "ai") &&
          (!m.toolCalls || m.toolCalls.length === 0)
        )
        .map(mapAgentMessageToMessage);

      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === selectedId ? { ...thread, messages } : thread
        )
      );
      loadedThreadsRef.current.add(selectedId);
    };

    loadMessages();
  }, [selectedId, orgId]);

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
    setThreads((prev) => {
      // Atualiza a thread com a nova mensagem
      const updated = prev.map((thread) => {
        if (thread.id === threadId) {
          // Atualiza titulo com preview da msg do usuario
          const newTitle =
            message.role === "user"
              ? message.content.slice(0, 100) + (message.content.length > 100 ? "..." : "")
              : thread.title;
          return {
            ...thread,
            title: newTitle,
            updatedAt: new Date(),
            messages: [...thread.messages, message],
          };
        }
        return thread;
      });

      // Move a thread atualizada para o topo da lista
      const threadIndex = updated.findIndex((t) => t.id === threadId);
      if (threadIndex > 0) {
        const [thread] = updated.splice(threadIndex, 1);
        updated.unshift(thread);
      }

      return updated;
    });
  }, []);

  const updateMessage = useCallback((threadId: string, messageId: string, content: string) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === threadId) {
          return {
            ...thread,
            messages: thread.messages.map((msg) =>
              msg.id === messageId ? { ...msg, content } : msg
            ),
          };
        }
        return thread;
      })
    );
  }, []);

  const updateThreadTitle = useCallback((threadId: string, title: string) => {
    setThreads((prev) =>
      prev.map((thread) => (thread.id === threadId ? { ...thread, title } : thread))
    );
  }, []);

  const updateConfig = useCallback((threadId: string, key: string, value: unknown) => {
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === threadId) {
          const newConfig = { ...thread.config, [key]: value } as ChatConfig;
          // Salva a config no storage da thread
          setThreadConfig(threadId, newConfig);
          return { ...thread, config: newConfig };
        }
        return thread;
      })
    );
  }, []);

  const updateConfigMultiple = useCallback(
    (threadId: string, updates: Partial<ChatConfig>) => {
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id === threadId) {
            const newConfig = { ...thread.config, ...updates } as ChatConfig;
            // Salva a config no storage da thread
            setThreadConfig(threadId, newConfig);
            return { ...thread, config: newConfig };
          }
          return thread;
        })
      );
    },
    []
  );

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
    updateMessage,
    updateThreadTitle,
    updateConfig,
    updateConfigMultiple,
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
