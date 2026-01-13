"use client";

import { MessageSquare, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MobileThreadsDrawerProps } from "./types";

// Drawer de threads para mobile
export function MobileThreadsDrawer({
  threads,
  selectedId,
  onSelect,
  onNewChat,
  open,
  onOpenChange,
}: MobileThreadsDrawerProps) {
  const handleSelect = (id: string) => {
    onSelect(id);
    onOpenChange(false);
  };

  const handleNewChat = () => {
    onNewChat();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-72">
        <SheetHeader className="sr-only">
          <SheetTitle>Conversas</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full bg-muted/40">
          <div className="p-4 pt-14 border-b">
            <Button
              variant="outline"
              size="default"
              onClick={handleNewChat}
              className="w-full"
            >
              <Plus className="h-4 w-4" />
              <span className="ml-2">Nova conversa</span>
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <nav className="p-2">
              <ul className="space-y-1">
                {threads.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">
                    Nenhuma conversa
                  </li>
                ) : (
                  threads.map((thread) => (
                    <li key={thread.id}>
                      <button
                        onClick={() => handleSelect(thread.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                          selectedId === thread.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <span className="truncate">{thread.title}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </nav>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
