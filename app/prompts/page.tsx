"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { usePrompts, useSidebarThreads } from "@/lib/hooks";
import { api } from "@/lib/api";
import { Header } from "@/components/header";
import { Sidebar, MobileSidebar, MobileThreadsDrawer } from "@/components/sidebar";
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
import type { ApiThread } from "@/lib/types";

export default function PromptsPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, hasOrganization, hasPermission, currentMembership } = useAuth();
  const orgId = currentMembership?.organizationId;

  // Hooks
  const { threads } = useSidebarThreads();
  const {
    prompts,
    isLoading: promptsLoading,
    createPrompt,
    updatePrompt,
    deletePrompt,
  } = usePrompts();

  // Estados de UI
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const canWrite = hasPermission("PROMPTS_WRITE");
  const canDelete = hasPermission("PROMPTS_DELETE");

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

  // Handlers for prompts
  const handleCreate = async (
    name: string,
    content: string,
    role: string
  ): Promise<{ error?: string }> => {
    return await createPrompt({ name, content, role });
  };

  const handleEdit = async (
    promptId: string,
    name: string,
    content: string,
    role: string
  ): Promise<{ error?: string }> => {
    return await updatePrompt(promptId, { name, content, role });
  };

  const handleDelete = async (promptId: string): Promise<{ error?: string }> => {
    return await deletePrompt(promptId);
  };

  const openEdit = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setEditOpen(true);
  };

  const openDelete = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setDeleteOpen(true);
  };

  const isLoading = authLoading || promptsLoading;

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
                {promptsLoading ? (
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
