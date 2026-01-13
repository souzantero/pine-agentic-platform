"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import type { ModelOption, ApiModelsResponse } from "@/lib/types";

interface UseModelsReturn {
  models: ModelOption[];
  configuredProviders: string[];
  isLoading: boolean;
  error: string | null;
  loadModelsForProvider: (provider: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useModels(): UseModelsReturn {
  const { currentMembership } = useSession();
  const orgId = currentMembership?.organizationId;

  const [models, setModels] = useState<ModelOption[]>([]);
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(
    async (provider?: string) => {
      if (!orgId) {
        setIsLoading(false);
        return;
      }

      try {
        setError(null);
        const url = provider
          ? `/organizations/${orgId}/models?provider=${provider}`
          : `/organizations/${orgId}/models`;

        const response = await api.get<ApiModelsResponse>(url);

        if (response.error) {
          setError(response.error);
          return;
        }

        if (response.data) {
          setModels(response.data.models || []);
          setConfiguredProviders(response.data.configuredProviders || []);
        }
      } catch (err) {
        console.error("Erro ao carregar modelos:", err);
        setError("Erro ao carregar modelos");
      } finally {
        setIsLoading(false);
      }
    },
    [orgId]
  );

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const loadModelsForProvider = useCallback(
    async (provider: string) => {
      setIsLoading(true);
      await loadModels(provider);
    },
    [loadModels]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadModels();
  }, [loadModels]);

  return {
    models,
    configuredProviders,
    isLoading,
    error,
    loadModelsForProvider,
    refresh,
  };
}
