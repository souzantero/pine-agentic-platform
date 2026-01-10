"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Invite, ApiPublicInvite, CreateInviteResult, MutationResult } from "@/lib/types";

interface UseInvitesReturn {
  invites: Invite[];
  isLoading: boolean;
  error: string | null;
  createInvite: (roleId: string) => Promise<CreateInviteResult>;
  refresh: () => Promise<void>;
}

export function useInvites(): UseInvitesReturn {
  const { currentMembership, hasPermission } = useAuth();
  const orgId = currentMembership?.organizationId;
  const canInvite = hasPermission("MEMBERS_INVITE");

  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    if (!orgId || !canInvite) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await api.get<Invite[]>(`/organizations/${orgId}/invites`);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setInvites(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar convites:", err);
      setError("Erro ao carregar convites");
    } finally {
      setIsLoading(false);
    }
  }, [orgId, canInvite]);

  useEffect(() => {
    loadInvites();
  }, [loadInvites]);

  const createInvite = useCallback(
    async (roleId: string): Promise<CreateInviteResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.post<{ inviteLink: string }>(
          `/organizations/${orgId}/invites`,
          { roleId }
        );

        if (response.error) {
          return { error: response.error };
        }

        // Recarregar convites após criação
        await loadInvites();

        return { inviteLink: response.data?.inviteLink };
      } catch {
        return { error: "Erro ao criar convite" };
      }
    },
    [orgId, loadInvites]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadInvites();
  }, [loadInvites]);

  return {
    invites,
    isLoading,
    error,
    createInvite,
    refresh,
  };
}

// Hook separado para aceitar convites (página pública)
interface UsePublicInviteReturn {
  invite: ApiPublicInvite | null;
  isLoading: boolean;
  error: string | null;
  acceptInvite: () => Promise<MutationResult>;
}

export function usePublicInvite(token: string): UsePublicInviteReturn {
  const { refreshSession } = useAuth();

  const [invite, setInvite] = useState<ApiPublicInvite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvite = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      setError("Token inválido");
      return;
    }

    try {
      setError(null);
      const response = await api.get<ApiPublicInvite>(`/invites/${token}`);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setInvite(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar convite:", err);
      setError("Erro ao carregar convite");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  const acceptInvite = useCallback(async (): Promise<MutationResult> => {
    if (!token) {
      return { error: "Token inválido" };
    }

    try {
      const response = await api.post(`/invites/${token}/accept`);

      if (response.error) {
        return { error: response.error };
      }

      // Atualizar sessão para refletir nova membership
      await refreshSession();

      return {};
    } catch {
      return { error: "Erro ao aceitar convite" };
    }
  }, [token, refreshSession]);

  return {
    invite,
    isLoading,
    error,
    acceptInvite,
  };
}
