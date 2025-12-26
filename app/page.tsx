"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { Sidebar, MobileSidebar, type Conversation } from "@/components/sidebar";
import { ChatArea, type Message } from "@/components/chat-area";
import { ChatSettings, MobileChatSettings, type AIModel } from "@/components/chat-settings";

interface ConversationWithMessages extends Conversation {
  messages: Message[];
  model: AIModel;
  temperature: number;
}

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, isLoading } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const handleNewChat = () => {
    const newConversation: ConversationWithMessages = {
      id: crypto.randomUUID(),
      title: "Nova conversa",
      updatedAt: new Date(),
      messages: [],
      model: "gpt-4",
      temperature: 0.7,
    };
    setConversations((prev) => [newConversation, ...prev]);
    setSelectedId(newConversation.id);
  };

  const handleModelChange = (model: AIModel) => {
    if (!selectedId) return;
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedId ? { ...conv, model } : conv
      )
    );
  };

  const handleTemperatureChange = (temperature: number) => {
    if (!selectedId) return;
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === selectedId ? { ...conv, temperature } : conv
      )
    );
  };

  const handleSendMessage = (content: string) => {
    if (!selectedId) {
      const newId = crypto.randomUUID();
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        createdAt: new Date(),
      };
      const newConversation: ConversationWithMessages = {
        id: newId,
        title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        updatedAt: new Date(),
        messages: [userMessage],
        model: "gpt-4",
        temperature: 0.7,
      };
      setConversations((prev) => [newConversation, ...prev]);
      setSelectedId(newId);

      simulateResponse(newId);
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === selectedId) {
          const isFirstMessage = conv.messages.length === 0;
          return {
            ...conv,
            title: isFirstMessage
              ? content.slice(0, 30) + (content.length > 30 ? "..." : "")
              : conv.title,
            updatedAt: new Date(),
            messages: [...conv.messages, userMessage],
          };
        }
        return conv;
      })
    );

    simulateResponse(selectedId);
  };

  const simulateResponse = (conversationId: string) => {
    setTimeout(() => {
      const conv = conversations.find((c) => c.id === conversationId);
      const modelName = conv?.model ?? "IA";

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Resposta simulada usando ${modelName}. Em breve, será integrado com o agente de IA.`,
        createdAt: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              messages: [...c.messages, assistantMessage],
            };
          }
          return c;
        })
      );
    }, 1000);
  };

  if (isLoading || !isLoggedIn) {
    return null;
  }

  const sidebarProps = {
    conversations,
    selectedId,
    onSelect: setSelectedId,
    onNewChat: handleNewChat,
  };

  return (
    <div className="h-screen flex flex-col">
      <Header
        onMenuClick={() => setMobileMenuOpen(true)}
        onSettingsClick={() => setMobileSettingsOpen(true)}
        showSettingsButton={!!selectedConversation}
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
            messages={selectedConversation?.messages ?? []}
            onSendMessage={handleSendMessage}
            disabled={!selectedConversation}
          />
        </main>

        {/* Settings Panel - Desktop only */}
        {selectedConversation && (
          <div className="hidden lg:flex h-full">
            <ChatSettings
              model={selectedConversation.model}
              onModelChange={handleModelChange}
              temperature={selectedConversation.temperature}
              onTemperatureChange={handleTemperatureChange}
              expanded={settingsExpanded}
              onExpandedChange={setSettingsExpanded}
            />
          </div>
        )}
      </div>

      {/* Mobile Settings */}
      {selectedConversation && (
        <MobileChatSettings
          model={selectedConversation.model}
          onModelChange={handleModelChange}
          temperature={selectedConversation.temperature}
          onTemperatureChange={handleTemperatureChange}
          open={mobileSettingsOpen}
          onOpenChange={setMobileSettingsOpen}
        />
      )}
    </div>
  );
}
