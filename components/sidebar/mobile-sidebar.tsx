"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MessageSquare,
  Users,
  Settings,
  Building2,
  ChevronDown,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import type { MobileSidebarProps, NavSection } from "./types";

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
