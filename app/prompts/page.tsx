"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import { usePrompts } from "@/lib/hooks";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PromptList,
  CreatePromptDialog,
  EditPromptDialog,
  DeletePromptDialog,
} from "@/components/prompts";
import { FileText, Plus } from "lucide-react";
import type { Prompt } from "@/lib/types";

export default function PromptsPage() {
  const { hasPermission } = useSession();

  // Hooks
  const {
    prompts,
    isLoading: promptsLoading,
    createPrompt,
    updatePrompt,
    deletePrompt,
  } = usePrompts();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const canWrite = hasPermission("PROMPTS_WRITE");
  const canDelete = hasPermission("PROMPTS_DELETE");

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

  return (
    <AppLayout>
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
    </AppLayout>
  );
}
