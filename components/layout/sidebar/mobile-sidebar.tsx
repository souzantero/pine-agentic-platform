"use client";

import { usePathname } from "next/navigation";
import { MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSession } from "@/lib/session";
import type { MobileSidebarProps, NavSection } from "./types";

// Menu mobile (apenas navegação, sem lista de threads)
function MobileMenuContent({
  onItemClick,
  onThreadsClick,
  onSettingsClick,
}: {
  onItemClick?: () => void;
  onThreadsClick: () => void;
  onSettingsClick: () => void;
}) {
  const pathname = usePathname();
  const { hasPermission } = useSession();

  const canViewMembers = hasPermission("MEMBERS_READ");
  const canManageOrg = hasPermission("ORGANIZATION_MANAGE");
  const canAccessSettings = canViewMembers || canManageOrg;

  // Determinar qual seção está ativa baseado na rota
  const getActiveSection = (): NavSection => {
    if (pathname === "/settings" || pathname.startsWith("/settings/")) return "settings";
    return "threads";
  };
  const activeSection = getActiveSection();

  const handleThreadsClick = () => {
    onItemClick?.();
    onThreadsClick();
  };

  const handleSettingsClick = () => {
    onItemClick?.();
    onSettingsClick();
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
          {canAccessSettings && (
            <li>
              <button
                onClick={handleSettingsClick}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  activeSection === "settings"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <Settings className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">Configurações</span>
              </button>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}

// Sidebar para mobile (drawer) - apenas menu de navegação
export function MobileSidebar({ open, onOpenChange, onThreadsClick, onSettingsClick }: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Menu de navegação</SheetTitle>
        </SheetHeader>
        <MobileMenuContent
          onItemClick={() => onOpenChange(false)}
          onThreadsClick={onThreadsClick}
          onSettingsClick={onSettingsClick}
        />
      </SheetContent>
    </Sheet>
  );
}
