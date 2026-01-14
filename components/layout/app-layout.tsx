"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useSidebarThreads, useModels } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { MobileSidebar } from "./sidebar/mobile-sidebar";
import { MobileThreadsDrawer } from "./sidebar/mobile-threads-drawer";
import type { ApiThread } from "@/lib/types";

interface AppLayoutProps {
  children: ReactNode;
  showSettingsButton?: boolean;
  onSettingsClick?: () => void;
}

export function AppLayout({ children, showSettingsButton, onSettingsClick }: AppLayoutProps) {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, hasOrganization, currentMembership } = useSession();
  const orgId = currentMembership?.organizationId;

  // Hooks
  const { threads } = useSidebarThreads();
  const { configuredProviders } = useModels();

  // Estados de UI
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);

  // Redirect se não autenticado
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push("/login");
      } else if (!hasOrganization) {
        router.push("/onboarding");
      }
    }
  }, [authLoading, isLoggedIn, hasOrganization, router]);

  // Handle thread selection - navigate to home
  const handleSelectThread = (id: string) => {
    setSelectedThreadId(id);
    router.push("/");
  };

  // Handle new chat
  const handleNewChat = async () => {
    if (!orgId) return;

    try {
      const response = await api.post<ApiThread>(
        `/organizations/${orgId}/threads`,
        {}
      );

      if (response.error || !response.data) return;

      router.push("/");
    } catch (error) {
      console.error("Erro ao criar thread:", error);
    }
  };

  const hasProviders = configuredProviders.length > 0;

  // Não renderiza nada enquanto verifica autenticação
  if (authLoading || !isLoggedIn || !hasOrganization) {
    return null;
  }

  const sidebarProps = {
    threads,
    selectedId: selectedThreadId,
    onSelect: handleSelectThread,
    onNewChat: handleNewChat,
    hasProviders,
  };

  return (
    <div className="h-screen flex flex-col">
      <Header
        onMenuClick={() => setMobileMenuOpen(true)}
        onSettingsClick={onSettingsClick}
        showSettingsButton={showSettingsButton}
      />

      {/* Mobile Menu */}
      <MobileSidebar
        open={mobileMenuOpen}
        onOpenChange={setMobileMenuOpen}
        onThreadsClick={() => setMobileThreadsOpen(true)}
      />

      {/* Mobile Threads Drawer */}
      <MobileThreadsDrawer
        threads={threads}
        selectedId={selectedThreadId}
        onSelect={handleSelectThread}
        onNewChat={handleNewChat}
        open={mobileThreadsOpen}
        onOpenChange={setMobileThreadsOpen}
        hasProviders={hasProviders}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar {...sidebarProps} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
