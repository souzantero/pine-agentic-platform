"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type {
  Prompt,
  SystemPrompt,
  ApiPrompt,
  CreatePromptData,
  UpdatePromptData,
  MutationResult,
} from "@/lib/types";

interface UsePromptsReturn {
  prompts: Prompt[];
  systemPrompts: SystemPrompt[];
  isLoading: boolean;
  error: string | null;
  createPrompt: (data: CreatePromptData) => Promise<MutationResult>;
  updatePrompt: (id: string, data: UpdatePromptData) => Promise<MutationResult>;
  deletePrompt: (id: string) => Promise<MutationResult>;
  refresh: () => Promise<void>;
}

// Converter resposta da API para tipo do frontend
function mapApiPromptToPrompt(p: ApiPrompt): Prompt {
  return {
    id: p.id,
    name: p.name,
    content: p.content,
    role: p.role as Prompt["role"],
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    createdBy: {
      id: p.createdById,
      user: { id: p.createdById, name: "" },
    },
  };
}

// Converter para SystemPrompt (usado no chat settings)
function mapApiPromptToSystemPrompt(p: ApiPrompt): SystemPrompt {
  return {
    id: p.id,
    name: p.name,
    content: p.content,
  };
}

export function usePrompts(): UsePromptsReturn {
  const { currentMembership } = useAuth();
  const orgId = currentMembership?.organizationId;

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrompts = useCallback(async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await api.get<ApiPrompt[]>(`/organizations/${orgId}/prompts`);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        // Mapear todos os prompts
        setPrompts(response.data.map(mapApiPromptToPrompt));

        // Filtrar apenas prompts SYSTEM para uso no chat
        const systemOnly = response.data
          .filter((p) => p.role === "SYSTEM")
          .map(mapApiPromptToSystemPrompt);
        setSystemPrompts(systemOnly);
      }
    } catch (err) {
      console.error("Erro ao carregar prompts:", err);
      setError("Erro ao carregar prompts");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  const createPrompt = useCallback(
    async (data: CreatePromptData): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.post<ApiPrompt>(
          `/organizations/${orgId}/prompts`,
          data
        );

        if (response.error) {
          return { error: response.error };
        }

        // Recarregar prompts após criação
        await loadPrompts();

        return {};
      } catch {
        return { error: "Erro ao criar prompt" };
      }
    },
    [orgId, loadPrompts]
  );

  const updatePrompt = useCallback(
    async (id: string, data: UpdatePromptData): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.put<ApiPrompt>(
          `/organizations/${orgId}/prompts/${id}`,
          data
        );

        if (response.error) {
          return { error: response.error };
        }

        // Recarregar prompts após atualização
        await loadPrompts();

        return {};
      } catch {
        return { error: "Erro ao atualizar prompt" };
      }
    },
    [orgId, loadPrompts]
  );

  const deletePrompt = useCallback(
    async (id: string): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.delete(`/organizations/${orgId}/prompts/${id}`);

        if (response.error) {
          return { error: response.error };
        }

        // Recarregar prompts após exclusão
        await loadPrompts();

        return {};
      } catch {
        return { error: "Erro ao excluir prompt" };
      }
    },
    [orgId, loadPrompts]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadPrompts();
  }, [loadPrompts]);

  return {
    prompts,
    systemPrompts,
    isLoading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    refresh,
  };
}
