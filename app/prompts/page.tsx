"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Header } from "@/components/header";
import { Sidebar, MobileSidebar, MobileThreadsDrawer, type Thread } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PromptList,
  CreatePromptDialog,
  EditPromptDialog,
  DeletePromptDialog,
  type Prompt,
} from "@/components/prompts";
import { FileText, Plus } from "lucide-react";

// Tipo da resposta da API de threads
interface ApiThread {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

// Tipo da resposta da API de prompts
interface ApiPrompt {
  id: string;
  name: string;
  content: string;
  role: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export default function PromptsPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, hasOrganization, hasPermission, currentMembership } = useAuth();
  const orgId = currentMembership?.organizationId;

  // Estados de threads para a sidebar
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);

  // Estados de prompts
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(true);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const canWrite = hasPermission("PROMPTS_WRITE");
  const canDelete = hasPermission("PROMPTS_DELETE");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        router.push("/login");
      } else if (!hasOrganization) {
        router.push("/onboarding");
      }
    }
  }, [isLoading, isLoggedIn, hasOrganization, router]);

  // Load threads for sidebar
  const loadThreads = useCallback(async () => {
    if (!orgId) return;

    try {
      const response = await api.get<ApiThread[]>(
        `/organizations/${orgId}/threads`
      );
      if (response.error || !response.data) return;

      const loadedThreads: Thread[] = response.data.map((t) => ({
        id: t.id,
        title: t.title || "Nova conversa",
        updatedAt: new Date(t.updatedAt),
      }));

      setThreads(loadedThreads);
    } catch (error) {
      console.error("Erro ao carregar threads:", error);
    }
  }, [orgId]);

  // Load prompts
  const loadPrompts = useCallback(async () => {
    if (!orgId) return;

    try {
      const response = await api.get<ApiPrompt[]>(
        `/organizations/${orgId}/prompts`
      );
      if (response.error || !response.data) return;

      setPrompts(response.data.map((p) => ({
        id: p.id,
        name: p.name,
        content: p.content,
        role: p.role as "SYSTEM" | "USER" | "ASSISTANT",
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        createdBy: {
          id: p.createdById,
          user: { id: p.createdById, name: "" },
        },
      })));
    } catch (error) {
      console.error("Failed to load prompts:", error);
    } finally {
      setLoadingPrompts(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (isLoggedIn && hasOrganization) {
      loadThreads();
      loadPrompts();
    }
  }, [isLoggedIn, hasOrganization, loadThreads, loadPrompts]);

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

  // Handlers for prompts
  const handleCreate = async (
    name: string,
    content: string,
    role: string
  ): Promise<{ error?: string }> => {
    if (!orgId) return { error: "Organização não selecionada" };

    try {
      const response = await api.post<ApiPrompt>(
        `/organizations/${orgId}/prompts`,
        { name, content, role }
      );

      if (response.error) {
        return { error: response.error };
      }

      loadPrompts();
      return {};
    } catch {
      return { error: "Erro ao criar prompt" };
    }
  };

  const handleEdit = async (
    promptId: string,
    name: string,
    content: string,
    role: string
  ): Promise<{ error?: string }> => {
    if (!orgId) return { error: "Organização não selecionada" };

    try {
      const response = await api.put<ApiPrompt>(
        `/organizations/${orgId}/prompts/${promptId}`,
        { name, content, role }
      );

      if (response.error) {
        return { error: response.error };
      }

      loadPrompts();
      return {};
    } catch {
      return { error: "Erro ao atualizar prompt" };
    }
  };

  const handleDelete = async (promptId: string): Promise<{ error?: string }> => {
    if (!orgId) return { error: "Organização não selecionada" };

    try {
      const response = await api.delete(
        `/organizations/${orgId}/prompts/${promptId}`
      );

      if (response.error) {
        return { error: response.error };
      }

      loadPrompts();
      return {};
    } catch {
      return { error: "Erro ao excluir prompt" };
    }
  };

  const openEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditOpen(true);
  };

  const openDelete = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setDeleteOpen(true);
  };

  if (isLoading || !isLoggedIn || !hasOrganization) {
    return null;
  }

  const sidebarProps = {
    threads,
    selectedId: selectedThreadId,
    onSelect: handleSelectThread,
    onNewChat: handleNewChat,
  };

  return (
    <div className="h-screen flex flex-col">
      <Header
        onMenuClick={() => setMobileMenuOpen(true)}
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
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar {...sidebarProps} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto py-6 px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Prompts</h1>
                  <p className="text-muted-foreground">
                    Gerencie os prompts da sua organização
                  </p>
                </div>
              </div>

              {canWrite && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Prompt
                </Button>
              )}
            </div>

            {/* Prompts Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Prompts ({prompts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPrompts ? (
                  <div className="flex justify-center py-8 text-muted-foreground">
                    Carregando...
                  </div>
                ) : (
                  <PromptList
                    prompts={prompts}
                    canEdit={canWrite}
                    canDelete={canDelete}
                    onEdit={openEdit}
                    onDelete={openDelete}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <CreatePromptDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      <EditPromptDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        prompt={selectedPrompt}
        onEdit={handleEdit}
      />

      <DeletePromptDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        prompt={selectedPrompt}
        onDelete={handleDelete}
      />
    </div>
  );
}
