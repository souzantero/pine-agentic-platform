"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Organization, UpdateOrganizationData, MutationResult } from "@/lib/types";

interface UseOrganizationReturn {
  organization: Organization | null;
  isLoading: boolean;
  error: string | null;
  updateOrganization: (data: UpdateOrganizationData) => Promise<MutationResult>;
  refresh: () => Promise<void>;
}

export function useOrganization(): UseOrganizationReturn {
  const { currentMembership, refreshSession } = useAuth();
  const orgId = currentMembership?.organizationId;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganization = useCallback(async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await api.get<Organization>(`/organizations/${orgId}`);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setOrganization(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar organização:", err);
      setError("Erro ao carregar organização");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  const updateOrganization = useCallback(
    async (data: UpdateOrganizationData): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.put<Organization>(
          `/organizations/${orgId}`,
          data
        );

        if (response.error) {
          return { error: response.error };
        }

        if (response.data) {
          setOrganization(response.data);
        }

        // Atualizar sessão para refletir mudanças no header
        await refreshSession();

        return {};
      } catch {
        return { error: "Erro ao atualizar organização" };
      }
    },
    [orgId, refreshSession]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadOrganization();
  }, [loadOrganization]);

  return {
    organization,
    isLoading,
    error,
    updateOrganization,
    refresh,
  };
}
