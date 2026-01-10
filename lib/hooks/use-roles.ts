"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Role } from "@/lib/types";

interface UseRolesReturn {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRoles(): UseRolesReturn {
  const { currentMembership } = useAuth();
  const orgId = currentMembership?.organizationId;

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await api.get<Role[]>(`/organizations/${orgId}/roles`);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setRoles(response.data);
      }
    } catch (err) {
      console.error("Erro ao carregar roles:", err);
      setError("Erro ao carregar funções");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadRoles();
  }, [loadRoles]);

  return {
    roles,
    isLoading,
    error,
    refresh,
  };
}
