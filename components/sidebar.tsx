"use client";

import { useState } from "react";
import { MessageSquare, PanelLeftClose, PanelLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface Conversation {
  id: string;
  title: string;
  updatedAt: Date;
}

type NavSection = "conversations";

interface SidebarProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

interface MobileSidebarProps extends SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Conteúdo compartilhado da sidebar
function SidebarContent({
  conversations,
  selectedId,
  onSelect,
  onNewChat,
  onItemClick,
  showMenuToggle = true,
  isMobile = false,
}: SidebarProps & { onItemClick?: () => void; showMenuToggle?: boolean; isMobile?: boolean }) {
  const [menuExpanded, setMenuExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<NavSection>("conversations");

  const handleSelect = (id: string) => {
    onSelect(id);
    onItemClick?.();
  };

  const handleNewChat = () => {
    onNewChat();
    onItemClick?.();
  };

  return (
    <div className="flex h-full">
      {/* Menu principal */}
      <aside
        className={cn(
          "border-r bg-muted/30 flex flex-col transition-all duration-300",
          menuExpanded ? "w-40" : "w-14"
        )}
      >
        {showMenuToggle && (
          <div className={cn("p-2", menuExpanded ? "flex justify-end" : "flex justify-center")}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuExpanded(!menuExpanded)}
              title={menuExpanded ? "Encolher menu" : "Expandir menu"}
            >
              {menuExpanded ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeft className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}

        <nav className={cn("flex-1 p-2", !showMenuToggle && "pt-4")}>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveSection("conversations")}
                title={!menuExpanded ? "Conversas" : undefined}
                className={cn(
                  "w-full flex items-center rounded-md transition-colors",
                  menuExpanded ? "gap-3 px-3 py-2" : "justify-center p-2",
                  activeSection === "conversations"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <MessageSquare className="h-5 w-5 shrink-0" />
                {menuExpanded && <span className="text-sm font-medium">Conversas</span>}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Submenu - Lista de conversas */}
      <aside className="w-56 border-r bg-muted/40 flex flex-col">
        <div className={cn("p-2", isMobile && "pt-12")}>
          <Button
            variant="outline"
            size="default"
            onClick={handleNewChat}
            title="Nova conversa"
            className="w-full"
          >
            <Plus className="h-4 w-4" />
            <span className="ml-2">Nova conversa</span>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-2">
            <ul className="space-y-1">
              {conversations.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhuma conversa
                </li>
              ) : (
                conversations.map((conv) => (
                  <li key={conv.id}>
                    <button
                      onClick={() => handleSelect(conv.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                        selectedId === conv.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate">{conv.title}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </nav>
        </ScrollArea>
      </aside>
    </div>
  );
}

// Sidebar para desktop
export function Sidebar(props: SidebarProps) {
  return (
    <div className="hidden md:flex h-full">
      <SidebarContent {...props} />
    </div>
  );
}

// Sidebar para mobile (drawer)
export function MobileSidebar({ open, onOpenChange, ...props }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de navegação</SheetTitle>
        </SheetHeader>
        <SidebarContent
          {...props}
          onItemClick={() => onOpenChange(false)}
          showMenuToggle={false}
          isMobile
        />
      </SheetContent>
    </Sheet>
  );
}
