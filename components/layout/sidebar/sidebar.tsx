"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Plus,
  Users,
  Settings,
  Building2,
  ChevronDown,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { getMenuExpanded, setMenuExpanded } from "@/lib/storage";
import type { SidebarProps, NavSection } from "./types";

// Conteúdo compartilhado da sidebar
function SidebarContent({
  threads,
  selectedId,
  onSelect,
  onNewChat,
  onItemClick,
  showMenuToggle = true,
  isMobile = false,
  hasProviders = true,
}: SidebarProps & { onItemClick?: () => void; showMenuToggle?: boolean; isMobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = useSession();
  const [menuExpanded, setMenuExpandedState] = useState(getMenuExpanded);

  // Manter menu de configurações aberto quando estiver em uma página de settings
  const isInSettings = pathname === "/settings" || pathname === "/members";
  const [settingsOpen, setSettingsOpen] = useState(isInSettings);

  // Sincronizar estado do menu com a rota
  useEffect(() => {
    if (isInSettings) {
      setSettingsOpen(true);
    }
  }, [isInSettings]);

  // Wrapper para persistir estado no storage
  const handleMenuExpandedChange = (expanded: boolean) => {
    setMenuExpandedState(expanded);
    setMenuExpanded(expanded);
  };

  const canViewMembers = hasPermission("MEMBERS_READ");
  const canManageOrg = hasPermission("ORGANIZATION_MANAGE");
  const canViewPrompts = hasPermission("PROMPTS_READ");

  // Determinar qual seção está ativa baseado na rota
  const getActiveSection = (): NavSection => {
    if (pathname === "/prompts") return "prompts";
    if (pathname === "/settings" || pathname === "/members") return "settings";
    return "threads";
  };
  const activeSection = getActiveSection();

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
              onClick={() => handleMenuExpandedChange(!menuExpanded)}
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
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
                                pathname === "/settings"
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
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
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
                                pathname === "/members"
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
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
                              className={cn(
                                "w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors text-sm",
                                pathname === "/settings"
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
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
                              className={cn(
                                "w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors text-sm",
                                pathname === "/members"
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
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
              title={hasProviders ? "Nova conversa" : "Configure um provedor primeiro"}
              className="w-full"
              disabled={!hasProviders}
            >
              <Plus className="h-4 w-4" />
              <span className="ml-2">Nova conversa</span>
            </Button>
            {!hasProviders && (
              <p className="text-xs text-muted-foreground mt-2 px-1">
                Configure um provedor em{" "}
                <button
                  onClick={handleOrganizationClick}
                  className="text-primary hover:underline"
                >
                  Configurações
                </button>{" "}
                para iniciar.
              </p>
            )}
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
