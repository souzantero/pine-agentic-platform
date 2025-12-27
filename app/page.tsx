"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { Sidebar, MobileSidebar, type Thread } from "@/components/sidebar";
import { ChatArea, type Message } from "@/components/chat-area";
import { ChatSettings, MobileChatSettings, type AIModel } from "@/components/chat-settings";

interface ThreadWithMessages extends Thread {
  messages: Message[];
  model: AIModel;
  temperature: number;
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
  const { isLoggedIn, isLoading, hasOrganization } = useAuth();
  const [threads, setThreads] = useState<ThreadWithMessages[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);

  // Carregar threads da API
  const loadThreads = useCallback(async () => {
    try {
      const response = await fetch("/api/threads");
      if (!response.ok) return;

      const data = await response.json();
      const loadedThreads: ThreadWithMessages[] = data.threads.map((t: ApiThread) => ({
        id: t.id,
        title: t.title || "Nova conversa",
        updatedAt: new Date(t.updatedAt),
        messages: [], // Mensagens serao carregadas quando implementarmos a API
        model: "gpt-4" as AIModel,
        temperature: 0.7,
      }));

      setThreads(loadedThreads);
    } catch (error) {
      console.error("Erro ao carregar threads:", error);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        router.push("/login");
      } else if (!hasOrganization) {
        router.push("/onboarding");
      } else {
        loadThreads();
      }
    }
  }, [isLoading, isLoggedIn, hasOrganization, router, loadThreads]);

  const selectedThread = threads.find((t) => t.id === selectedId);

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        console.error("Erro ao criar thread");
        return;
      }

      const data = await response.json();
      const newThread: ThreadWithMessages = {
        id: data.thread.id,
        title: data.thread.title || "Nova conversa",
        updatedAt: new Date(data.thread.updatedAt),
        messages: [],
        model: "gpt-4",
        temperature: 0.7,
      };

      setThreads((prev) => [newThread, ...prev]);
      setSelectedId(newThread.id);
    } catch (error) {
      console.error("Erro ao criar thread:", error);
    }
  };

  const handleModelChange = (model: AIModel) => {
    if (!selectedId) return;
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedId ? { ...thread, model } : thread
      )
    );
  };

  const handleTemperatureChange = (temperature: number) => {
    if (!selectedId) return;
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === selectedId ? { ...thread, temperature } : thread
      )
    );
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedId) {
      // Criar thread via API quando nao houver thread selecionada
      try {
        const title = content.slice(0, 30) + (content.length > 30 ? "..." : "");
        const response = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });

        if (!response.ok) {
          console.error("Erro ao criar thread");
          return;
        }

        const data = await response.json();
        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content,
          createdAt: new Date(),
        };

        const newThread: ThreadWithMessages = {
          id: data.thread.id,
          title: data.thread.title || title,
          updatedAt: new Date(data.thread.updatedAt),
          messages: [userMessage],
          model: "gpt-4",
          temperature: 0.7,
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
      const modelName = thread?.model ?? "IA";

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Resposta simulada usando ${modelName}. Em breve, será integrado com o agente de IA.`,
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

      {/* Mobile Sidebar */}
      <MobileSidebar
        {...sidebarProps}
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar {...sidebarProps} />

        <main className="flex-1 overflow-hidden">
          <ChatArea
            messages={selectedThread?.messages ?? []}
            onSendMessage={handleSendMessage}
            disabled={!selectedThread}
          />
        </main>

        {/* Settings Panel - Desktop only */}
        {selectedThread && (
          <div className="hidden lg:flex h-full">
            <ChatSettings
              model={selectedThread.model}
              onModelChange={handleModelChange}
              temperature={selectedThread.temperature}
              onTemperatureChange={handleTemperatureChange}
              expanded={settingsExpanded}
              onExpandedChange={setSettingsExpanded}
            />
          </div>
        )}
      </div>

      {/* Mobile Settings */}
      {selectedThread && (
        <MobileChatSettings
          model={selectedThread.model}
          onModelChange={handleModelChange}
          temperature={selectedThread.temperature}
          onTemperatureChange={handleTemperatureChange}
          open={mobileSettingsOpen}
          onOpenChange={setMobileSettingsOpen}
        />
      )}
    </div>
  );
}
