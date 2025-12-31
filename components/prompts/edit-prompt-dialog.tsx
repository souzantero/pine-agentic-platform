"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil } from "lucide-react";
import type { Prompt } from "./prompt-list";

interface EditPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt | null;
  onEdit: (promptId: string, name: string, content: string, role: string) => Promise<{ error?: string }>;
}

// Componente interno que recebe o prompt garantidamente não-null
function EditPromptForm({
  prompt,
  onOpenChange,
  onEdit,
}: {
  prompt: Prompt;
  onOpenChange: (open: boolean) => void;
  onEdit: (promptId: string, name: string, content: string, role: string) => Promise<{ error?: string }>;
}) {
  const [name, setName] = useState(prompt.name);
  const [content, setContent] = useState(prompt.content);
  const [role, setRole] = useState<string>(prompt.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!name.trim()) {
      setError("Nome é obrigatório");
      return;
    }

    if (!content.trim()) {
      setError("Conteúdo é obrigatório");
      return;
    }

    setError(null);
    setLoading(true);

    const result = await onEdit(prompt.id, name.trim(), content.trim(), role);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  return (
    <AlertDialogContent className="max-w-[90vw] md:max-w-lg">
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2">
          <Pencil className="h-5 w-5" />
          Editar Prompt
        </AlertDialogTitle>
        <AlertDialogDescription>
          Atualize as informações do prompt.
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div className="space-y-4 py-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="edit-name">Nome</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do prompt"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-role">Role</Label>
          <Select value={role} onValueChange={setRole} disabled>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SYSTEM">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-content">Conteúdo</Label>
          <Textarea
            id="edit-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite o conteúdo do prompt..."
            rows={6}
          />
        </div>
      </div>

      <AlertDialogFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handleEdit} disabled={loading}>
          {loading ? "Salvando..." : "Salvar"}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}

export function EditPromptDialog({
  open,
  onOpenChange,
  prompt,
  onEdit,
}: EditPromptDialogProps) {
  if (!prompt) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <EditPromptForm
        key={prompt.id}
        prompt={prompt}
        onOpenChange={onOpenChange}
        onEdit={onEdit}
      />
    </AlertDialog>
  );
}
