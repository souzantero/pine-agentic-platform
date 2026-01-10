"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Member, MutationResult } from "@/lib/types";

interface UseMembersReturn {
  members: Member[];
  isLoading: boolean;
  error: string | null;
  changeRole: (memberId: string, roleId: string) => Promise<MutationResult>;
  removeMember: (memberId: string) => Promise<MutationResult>;
  refresh: () => Promise<void>;
}

export function useMembers(): UseMembersReturn {
  const { currentMembership } = useAuth();
  const orgId = currentMembership?.organizationId;

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await api.get<Member[]>(`/organizations/${orgId}/members`);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setMembers(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar membros:", err);
      setError("Erro ao carregar membros");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const changeRole = useCallback(
    async (memberId: string, roleId: string): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.put(
          `/organizations/${orgId}/members/${memberId}/role`,
          { roleId }
        );

        if (response.error) {
          return { error: response.error };
        }

        // Recarregar membros após alteração
        await loadMembers();

        return {};
      } catch {
        return { error: "Erro ao alterar função" };
      }
    },
    [orgId, loadMembers]
  );

  const removeMember = useCallback(
    async (memberId: string): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.delete(
          `/organizations/${orgId}/members/${memberId}`
        );

        if (response.error) {
          return { error: response.error };
        }

        // Recarregar membros após remoção
        await loadMembers();

        return {};
      } catch {
        return { error: "Erro ao remover membro" };
      }
    },
    [orgId, loadMembers]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadMembers();
  }, [loadMembers]);

  return {
    members,
    isLoading,
    error,
    changeRole,
    removeMember,
    refresh,
  };
}
