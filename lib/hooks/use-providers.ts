"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import type {
  ProviderConfig,
  ProviderType,
  Provider,
  ApiProvidersResponse,
  MutationResult,
} from "@/lib/types";

interface UseProvidersReturn {
  providers: ProviderConfig[];
  isLoading: boolean;
  error: string | null;
  addProvider: (
    type: ProviderType,
    provider: Provider,
    apiKey: string
  ) => Promise<MutationResult>;
  removeProvider: (id: string) => Promise<MutationResult>;
  refresh: () => Promise<void>;
  getProvidersByType: (type: ProviderType) => ProviderConfig[];
}

export function useProviders(): UseProvidersReturn {
  const { currentMembership } = useSession();
  const orgId = currentMembership?.organizationId;

  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await api.get<ApiProvidersResponse>(
        `/organizations/${orgId}/providers`
      );

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setProviders(response.data.providers);
      }
    } catch (err) {
      console.error("Erro ao carregar provedores:", err);
      setError("Erro ao carregar provedores");
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const addProvider = useCallback(
    async (
      type: ProviderType,
      provider: Provider,
      apiKey: string
    ): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.post<ProviderConfig>(
          `/organizations/${orgId}/providers`,
          { type, provider, apiKey }
        );

        if (response.error) {
          return { error: response.error };
        }

        // Recarregar provedores após adição
        await loadProviders();

        return {};
      } catch {
        return { error: "Erro ao adicionar provedor" };
      }
    },
    [orgId, loadProviders]
  );

  const removeProvider = useCallback(
    async (id: string): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.delete(
          `/organizations/${orgId}/providers/${id}`
        );

        if (response.error) {
          return { error: response.error };
        }

        // Recarregar provedores após remoção
        await loadProviders();

        return {};
      } catch {
        return { error: "Erro ao remover provedor" };
      }
    },
    [orgId, loadProviders]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadProviders();
  }, [loadProviders]);

  const getProvidersByType = useCallback(
    (type: ProviderType): ProviderConfig[] => {
      return providers.filter((p) => p.type === type);
    },
    [providers]
  );

  return {
    providers,
    isLoading,
    error,
    addProvider,
    removeProvider,
    refresh,
    getProvidersByType,
  };
}
