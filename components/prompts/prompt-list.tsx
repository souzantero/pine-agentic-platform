"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Pencil, Trash2, Bot, User, Settings2 } from "lucide-react";
import type { Prompt } from "@/lib/types";

interface PromptListProps {
  prompts: Prompt[];
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (prompt: Prompt) => void;
  onDelete: (prompt: Prompt) => void;
}

const roleLabels: Record<Prompt["role"], { label: string; icon: React.ReactNode }> = {
  SYSTEM: { label: "Sistema", icon: <Settings2 className="h-3.5 w-3.5" /> },
  USER: { label: "Usuário", icon: <User className="h-3.5 w-3.5" /> },
  ASSISTANT: { label: "Assistente", icon: <Bot className="h-3.5 w-3.5" /> },
};

export function PromptList({
  prompts,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: PromptListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (prompts.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Nenhum prompt encontrado
      </div>
    );
  }

  const canManage = canEdit || canDelete;

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      {/* Desktop view - Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="pb-3 font-medium">Nome</th>
              <th className="pb-3 font-medium">Role</th>
              <th className="pb-3 font-medium">Conteúdo</th>
              <th className="pb-3 font-medium">Atualizado</th>
              {canManage && <th className="pb-3 font-medium w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {prompts.map((prompt) => (
              <tr key={prompt.id} className="border-b last:border-0">
                <td className="py-3">
                  <span className="font-medium">{prompt.name}</span>
                </td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm">
                    {roleLabels[prompt.role].icon}
                    {roleLabels[prompt.role].label}
                  </span>
                </td>
                <td className="py-3 text-sm text-muted-foreground max-w-xs">
                  {truncateContent(prompt.content)}
                </td>
                <td className="py-3 text-sm text-muted-foreground">
                  {formatDate(prompt.updatedAt)}
                </td>
                {canManage && (
                  <td className="py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem onClick={() => onEdit(prompt)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(prompt)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view - Cards */}
      <div className="md:hidden space-y-3">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="flex items-start justify-between p-3 rounded-lg border"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium truncate">{prompt.name}</span>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs">
                  {roleLabels[prompt.role].icon}
                  {roleLabels[prompt.role].label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {prompt.content}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(prompt.updatedAt)}
              </p>
            </div>
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(prompt)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(prompt)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
