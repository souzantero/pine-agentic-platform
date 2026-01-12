"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageSquare, PanelLeftClose, PanelLeft, Plus, Users, Settings, Building2, ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSession } from "@/lib/session";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Thread {
  id: string;
  title: string;
  updatedAt: Date;
}

type NavSection = "threads" | "prompts" | "settings";

interface SidebarProps {
  threads: Thread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onThreadsClick: () => void;
}

interface MobileThreadsDrawerProps {
  threads: Thread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Conteúdo compartilhado da sidebar
function SidebarContent({
  threads,
  selectedId,
  onSelect,
  onNewChat,
  onItemClick,
  showMenuToggle = true,
  isMobile = false,
}: SidebarProps & { onItemClick?: () => void; showMenuToggle?: boolean; isMobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = useSession();
  const [menuExpanded, setMenuExpanded] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const canViewMembers = hasPermission("MEMBERS_READ");
  const canManageOrg = hasPermission("ORGANIZATION_MANAGE");
  const canViewPrompts = hasPermission("PROMPTS_READ");

  // Determinar qual seção está ativa baseado na rota
  const activeSection: NavSection = pathname === "/prompts" ? "prompts" : "threads";

  const handleSelect = (id: string) => {
    onSelect(id);
    onItemClick?.();
  };

  const handleNewChat = () => {
    onNewChat();
    onItemClick?.();
  };

  const handleMembersClick = () => {
    router.push("/members");
    onItemClick?.();
  };

  const handleOrganizationClick = () => {
    router.push("/settings");
    onItemClick?.();
  };

  const handlePromptsClick = () => {
    router.push("/prompts");
    onItemClick?.();
  };

  const handleConversasClick = () => {
    router.push("/");
    onItemClick?.();
  };

  const canAccessSettings = canViewMembers || canManageOrg;

  return (
    <div className="flex h-full">
      {/* Menu principal */}
      <aside
        className={cn(
          "border-r bg-muted/30 flex flex-col transition-all duration-300",
          menuExpanded ? "w-48" : "w-14"
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
                onClick={handleConversasClick}
                title={!menuExpanded ? "Conversas" : undefined}
                className={cn(
                  "w-full flex items-center rounded-md transition-colors",
                  menuExpanded ? "gap-3 px-3 py-2" : "justify-center p-2",
                  activeSection === "threads"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <MessageSquare className="h-5 w-5 shrink-0" />
                {menuExpanded && <span className="text-sm font-medium">Conversas</span>}
              </button>
            </li>
            {canViewPrompts && (
              <li>
                <button
                  onClick={handlePromptsClick}
                  title={!menuExpanded ? "Prompts" : undefined}
                  className={cn(
                    "w-full flex items-center rounded-md transition-colors",
                    menuExpanded ? "gap-3 px-3 py-2" : "justify-center p-2",
                    activeSection === "prompts"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <FileText className="h-5 w-5 shrink-0" />
                  {menuExpanded && <span className="text-sm font-medium">Prompts</span>}
                </button>
              </li>
            )}
            {canAccessSettings && (
              <li>
                {menuExpanded ? (
                  <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <CollapsibleTrigger asChild>
                      <button
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                          settingsOpen ? "bg-muted" : "hover:bg-muted"
                        )}
                      >
                        <Settings className="h-5 w-5 shrink-0" />
                        <span className="text-sm font-medium flex-1 text-left">Configurações</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            settingsOpen && "rotate-180"
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <ul className="ml-4 mt-1 space-y-1 border-l pl-2">
                        {canManageOrg && (
                          <li>
                            <button
                              onClick={handleOrganizationClick}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm hover:bg-muted"
                            >
                              <Building2 className="h-4 w-4 shrink-0" />
                              <span>Organização</span>
                            </button>
                          </li>
                        )}
                        {canViewMembers && (
                          <li>
                            <button
                              onClick={handleMembersClick}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm hover:bg-muted"
                            >
                              <Users className="h-4 w-4 shrink-0" />
                              <span>Membros</span>
                            </button>
                          </li>
                        )}
                      </ul>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <PopoverTrigger asChild>
                      <button
                        title="Configurações"
                        className={cn(
                          "w-full flex items-center justify-center p-2 rounded-md transition-colors",
                          settingsOpen ? "bg-muted" : "hover:bg-muted"
                        )}
                      >
                        <Settings className="h-5 w-5 shrink-0" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" className="w-48 p-1">
                      <div className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                        Configurações
                      </div>
                      <ul className="space-y-1">
                        {canManageOrg && (
                          <li>
                            <button
                              onClick={() => {
                                handleOrganizationClick();
                                setSettingsOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors text-sm hover:bg-muted"
                            >
                              <Building2 className="h-4 w-4 shrink-0" />
                              <span>Organização</span>
                            </button>
                          </li>
                        )}
                        {canViewMembers && (
                          <li>
                            <button
                              onClick={() => {
                                handleMembersClick();
                                setSettingsOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors text-sm hover:bg-muted"
                            >
                              <Users className="h-4 w-4 shrink-0" />
                              <span>Membros</span>
                            </button>
                          </li>
                        )}
                      </ul>
                    </PopoverContent>
                  </Popover>
                )}
              </li>
            )}
          </ul>
        </nav>
      </aside>

      {/* Submenu - Lista de threads (só aparece quando Conversas está ativo) */}
      {activeSection === "threads" && (
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
        </aside>
      )}
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

// Menu mobile (apenas navegação, sem lista de threads)
function MobileMenuContent({
  onItemClick,
  onThreadsClick,
}: {
  onItemClick?: () => void;
  onThreadsClick: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const canViewMembers = hasPermission("MEMBERS_READ");
  const canManageOrg = hasPermission("ORGANIZATION_MANAGE");
  const canViewPrompts = hasPermission("PROMPTS_READ");
  const canAccessSettings = canViewMembers || canManageOrg;

  // Determinar qual seção está ativa baseado na rota
  const activeSection: NavSection = pathname === "/prompts" ? "prompts" : "threads";

  const handleMembersClick = () => {
    router.push("/members");
    onItemClick?.();
  };

  const handleOrganizationClick = () => {
    router.push("/settings");
    onItemClick?.();
  };

  const handlePromptsClick = () => {
    router.push("/prompts");
    onItemClick?.();
  };

  const handleThreadsClick = () => {
    onItemClick?.();
    onThreadsClick();
  };

  return (
    <aside className="w-56 bg-muted/30 flex flex-col h-full">
      <nav className="flex-1 p-4 pt-14">
        <ul className="space-y-2">
          <li>
            <button
              onClick={handleThreadsClick}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                activeSection === "threads"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <MessageSquare className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">Conversas</span>
            </button>
          </li>
          {canViewPrompts && (
            <li>
              <button
                onClick={handlePromptsClick}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  activeSection === "prompts"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <FileText className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Prompts</span>
              </button>
            </li>
          )}
          {canAccessSettings && (
            <li>
              <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                      settingsOpen ? "bg-muted" : "hover:bg-muted"
                    )}
                  >
                    <Settings className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium flex-1 text-left">Configurações</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        settingsOpen && "rotate-180"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ul className="ml-4 mt-1 space-y-1 border-l pl-2">
                    {canManageOrg && (
                      <li>
                        <button
                          onClick={handleOrganizationClick}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm hover:bg-muted"
                        >
                          <Building2 className="h-4 w-4 shrink-0" />
                          <span>Organização</span>
                        </button>
                      </li>
                    )}
                    {canViewMembers && (
                      <li>
                        <button
                          onClick={handleMembersClick}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm hover:bg-muted"
                        >
                          <Users className="h-4 w-4 shrink-0" />
                          <span>Membros</span>
                        </button>
                      </li>
                    )}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

// Sidebar para mobile (drawer) - apenas menu de navegação
export function MobileSidebar({ open, onOpenChange, onThreadsClick }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de navegação</SheetTitle>
        </SheetHeader>
        <MobileMenuContent
          onItemClick={() => onOpenChange(false)}
          onThreadsClick={onThreadsClick}
        />
      </SheetContent>
    </Sheet>
  );
}

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
