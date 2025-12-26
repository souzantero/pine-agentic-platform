"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { Sidebar, type Conversation } from "@/components/sidebar";
import { ChatArea, type Message } from "@/components/chat-area";

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithMessages[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  const selectedConversation = conversations.find((c) => c.id === selectedId);

  const handleNewChat = () => {
    const newConversation: ConversationWithMessages = {
      id: crypto.randomUUID(),
      title: "Nova conversa",
      updatedAt: new Date(),
      messages: [],
    };
    setConversations((prev) => [newConversation, ...prev]);
    setSelectedId(newConversation.id);
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
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Esta é uma resposta simulada. Em breve, será integrado com o agente de IA.",
        createdAt: new Date(),
      };

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: [...conv.messages, assistantMessage],
            };
          }
          return conv;
        })
      );
    }, 1000);
  };

  // Não renderiza enquanto redireciona
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={conversations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNewChat={handleNewChat}
        />
        <main className="flex-1 overflow-hidden">
          <ChatArea
            messages={selectedConversation?.messages ?? []}
            onSendMessage={handleSendMessage}
          />
        </main>
      </div>
    </div>
  );
}
