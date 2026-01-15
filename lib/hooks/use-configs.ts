"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import type {
  OrgConfig,
  ConfigType,
  ConfigKey,
  ApiOrgConfigsResponse,
  MutationResult,
} from "@/lib/types";

interface UseConfigsReturn {
  configs: OrgConfig[];
  isLoading: boolean;
  error: string | null;
  createConfig: (
    type: ConfigType,
    key: ConfigKey,
    isEnabled: boolean,
    config: Record<string, unknown>
  ) => Promise<MutationResult>;
  updateConfig: (
    type: ConfigType,
    key: ConfigKey,
    isEnabled?: boolean,
    config?: Record<string, unknown>
  ) => Promise<MutationResult>;
  deleteConfig: (type: ConfigType, key: ConfigKey) => Promise<MutationResult>;
  refresh: () => Promise<void>;
  getConfigsByType: (type: ConfigType) => OrgConfig[];
  getConfig: (type: ConfigType, key: ConfigKey) => OrgConfig | undefined;
}

export function useConfigs(filterType?: ConfigType): UseConfigsReturn {
  const { currentMembership } = useSession();
  const orgId = currentMembership?.organizationId;

  const [configs, setConfigs] = useState<OrgConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfigs = useCallback(async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const url = filterType
        ? `/organizations/${orgId}/configs?type=${filterType}`
        : `/organizations/${orgId}/configs`;
      const response = await api.get<ApiOrgConfigsResponse>(url);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data) {
        setConfigs(
          response.data.configs.map((c) => ({
            id: c.id,
            type: c.type as ConfigType,
            key: c.key as ConfigKey,
            isEnabled: c.isEnabled,
            config: c.config,
          }))
        );
      }
    } catch (err) {
      console.error("Erro ao carregar configuracoes:", err);
      setError("Erro ao carregar configuracoes");
    } finally {
      setIsLoading(false);
    }
  }, [orgId, filterType]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const createConfig = useCallback(
    async (
      type: ConfigType,
      key: ConfigKey,
      isEnabled: boolean,
      config: Record<string, unknown>
    ): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.post<OrgConfig>(
          `/organizations/${orgId}/configs`,
          { type, key, isEnabled, config }
        );

        if (response.error) {
          return { error: response.error };
        }

        await loadConfigs();
        return {};
      } catch {
        return { error: "Erro ao criar configuração" };
      }
    },
    [orgId, loadConfigs]
  );

  const updateConfig = useCallback(
    async (
      type: ConfigType,
      key: ConfigKey,
      isEnabled?: boolean,
      config?: Record<string, unknown>
    ): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const payload: { isEnabled?: boolean; config?: Record<string, unknown> } = {};
        if (isEnabled !== undefined) payload.isEnabled = isEnabled;
        if (config !== undefined) payload.config = config;

        const response = await api.put<OrgConfig>(
          `/organizations/${orgId}/configs/${type}/${key}`,
          payload
        );

        if (response.error) {
          return { error: response.error };
        }

        await loadConfigs();
        return {};
      } catch {
        return { error: "Erro ao atualizar configuração" };
      }
    },
    [orgId, loadConfigs]
  );

  const deleteConfig = useCallback(
    async (type: ConfigType, key: ConfigKey): Promise<MutationResult> => {
      if (!orgId) {
        return { error: "Organização não selecionada" };
      }

      try {
        const response = await api.delete(
          `/organizations/${orgId}/configs/${type}/${key}`
        );

        if (response.error) {
          return { error: response.error };
        }

        await loadConfigs();
        return {};
      } catch {
        return { error: "Erro ao remover configuração" };
      }
    },
    [orgId, loadConfigs]
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await loadConfigs();
  }, [loadConfigs]);

  const getConfigsByType = useCallback(
    (type: ConfigType): OrgConfig[] => {
      return configs.filter((c) => c.type === type);
    },
    [configs]
  );

  const getConfig = useCallback(
    (type: ConfigType, key: ConfigKey): OrgConfig | undefined => {
      return configs.find((c) => c.type === type && c.key === key);
    },
    [configs]
  );

  return {
    configs,
    isLoading,
    error,
    createConfig,
    updateConfig,
    deleteConfig,
    refresh,
    getConfigsByType,
    getConfig,
  };
}
