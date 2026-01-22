"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "./markdown-content";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatArea({ messages, onSendMessage, isLoading, disabled }: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || disabled) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 md:p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-center px-4">
              <p className="text-sm md:text-base">
                {disabled
                  ? "Selecione uma conversa existente ou clique em \"Nova conversa\" para começar"
                  : "Envie uma mensagem para começar a conversa"}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] md:max-w-[80%] rounded-lg px-3 py-2 md:px-4",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "assistant" ? (
                    <MarkdownContent
                      content={message.content}
                      className="text-sm md:text-base"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap text-sm md:text-base">
                      {message.content}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t p-2 md:p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Selecione ou crie uma conversa..." : "Digite sua mensagem..."}
              className="min-h-[44px] max-h-[120px] md:max-h-[200px] resize-none text-sm md:text-base"
              rows={1}
              disabled={isLoading || disabled}
            />
            <Button type="submit" size="icon" className="min-h-[44px] min-w-[44px] h-auto" disabled={!input.trim() || isLoading || disabled}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center hidden md:block">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </form>
      </div>
    </div>
  );
}
