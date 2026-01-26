"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useConfigs, useProviders, useModels } from "@/lib/hooks";
import { TOOLS } from "@/lib/types";
import type { ConfigKey, WebSearchConfig } from "@/lib/types";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wrench, Check, Loader2 } from "lucide-react";

interface ToolFormState {
  isEnabled: boolean;
  provider: string;
  summarizationProvider: string;
  summarizationModel: string;
  summarizationMaxTokens: number;
  maxContentLength: number;
  maxOutputRetries: number;
  saving: boolean;
  error: string | null;
  success: boolean;
}

const defaultToolConfig: ToolFormState = {
  isEnabled: true,
  provider: "",
  summarizationProvider: "",
  summarizationModel: "",
  summarizationMaxTokens: 8192,
  maxContentLength: 50000,
  maxOutputRetries: 3,
  saving: false,
  error: null,
  success: false,
};

export default function ToolsPage() {
  const router = useRouter();
  const { isLoading: authLoading, hasPermission } = useSession();

  const {
    configs,
    isLoading: configsLoading,
    createConfig,
    updateConfig,
    getConfig,
  } = useConfigs("TOOL");

  const { getProvidersByType } = useProviders();
  const { models } = useModels();

  const [formStates, setFormStates] = useState<Record<ConfigKey, ToolFormState>>({
    WEB_SEARCH: { ...defaultToolConfig },
    WEB_FETCH: { ...defaultToolConfig },
  });

  const canManage = hasPermission("ORGANIZATION_MANAGE");

  // Redirect se sem permissao
  useEffect(() => {
    if (!authLoading && !canManage) {
      router.push("/");
    }
  }, [authLoading, canManage, router]);

  // Carrega configuracoes existentes para os formularios
  useEffect(() => {
    if (!configsLoading && configs.length > 0) {
      const newStates = { ...formStates };

      for (const tool of TOOLS) {
        const existingConfig = getConfig("TOOL", tool.key);
        if (existingConfig) {
          const config = existingConfig.config as WebSearchConfig;
          newStates[tool.key] = {
            ...newStates[tool.key],
            isEnabled: existingConfig.isEnabled,
            provider: config.provider ?? "",
            summarizationProvider: config.summarizationProvider ?? "",
            summarizationModel: config.summarizationModel ?? "",
            summarizationMaxTokens: config.summarizationMaxTokens ?? 8192,
            maxContentLength: config.maxContentLength ?? 50000,
            maxOutputRetries: config.maxOutputRetries ?? 3,
          };
        }
      }

      setFormStates(newStates);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configsLoading, configs]);

  const updateFormState = (
    key: ConfigKey,
    updates: Partial<ToolFormState>
  ) => {
    setFormStates((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
  };

  const handleSave = async (key: ConfigKey) => {
    const state = formStates[key];

    updateFormState(key, { error: null, success: false, saving: true });

    const config: Record<string, unknown> = {};
    if (state.provider) config.provider = state.provider;
    if (state.summarizationProvider) config.summarizationProvider = state.summarizationProvider;
    if (state.summarizationModel) config.summarizationModel = state.summarizationModel;
    config.summarizationMaxTokens = state.summarizationMaxTokens;
    config.maxContentLength = state.maxContentLength;
    config.maxOutputRetries = state.maxOutputRetries;

    const existingConfig = getConfig("TOOL", key);
    let result;

    if (existingConfig) {
      result = await updateConfig("TOOL", key, state.isEnabled, config);
    } else {
      result = await createConfig("TOOL", key, state.isEnabled, config);
    }

    if (result.error) {
      updateFormState(key, { error: result.error, saving: false });
    } else {
      updateFormState(key, { success: true, saving: false });
      setTimeout(() => updateFormState(key, { success: false }), 3000);
    }
  };

  // Provedores disponiveis por tipo
  const webSearchProviders = getProvidersByType("WEB_SEARCH");
  const llmProviders = getProvidersByType("LLM");

  const isLoading = authLoading || configsLoading;

  if (isLoading || !canManage) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wrench className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Ferramentas</h1>
            <p className="text-muted-foreground">
              Configure as ferramentas disponíveis para o agente de IA
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {TOOLS.map((tool) => {
            const state = formStates[tool.key];
            const existingConfig = getConfig("TOOL", tool.key);

            return (
              <Card key={tool.key}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{tool.label}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </div>
                    <Switch
                      checked={state.isEnabled}
                      onCheckedChange={(checked) =>
                        updateFormState(tool.key, { isEnabled: checked })
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {state.error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                      {state.error}
                    </div>
                  )}

                  {state.success && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 rounded-md flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Configuração salva com sucesso!
                    </div>
                  )}

                  {/* Provedor da ferramenta */}
                  <div className="space-y-2">
                    <Label>Provedor</Label>
                    {webSearchProviders.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum provedor de busca configurado.{" "}
                        <a
                          href="/settings/providers"
                          className="text-primary hover:underline"
                        >
                          Configure um provedor
                        </a>{" "}
                        primeiro.
                      </p>
                    ) : (
                      <Select
                        value={state.provider}
                        onValueChange={(value) =>
                          updateFormState(tool.key, { provider: value })
                        }
                        disabled={!state.isEnabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um provedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {webSearchProviders.map((provider) => (
                            <SelectItem
                              key={provider.id}
                              value={provider.provider}
                            >
                              {provider.provider}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  {/* Configuracoes de sumarizacao */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">
                      Sumarização de Resultados
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Configure como os resultados da busca serão resumidos antes
                      de serem enviados ao modelo
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Provedor LLM</Label>
                        {llmProviders.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhum provedor LLM configurado.
                          </p>
                        ) : (
                          <Select
                            value={state.summarizationProvider}
                            onValueChange={(value) =>
                              updateFormState(tool.key, {
                                summarizationProvider: value,
                              })
                            }
                            disabled={!state.isEnabled}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {llmProviders.map((provider) => (
                                <SelectItem
                                  key={provider.id}
                                  value={provider.provider}
                                >
                                  {provider.provider}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Modelo</Label>
                        <Select
                          value={state.summarizationModel}
                          onValueChange={(value) =>
                            updateFormState(tool.key, {
                              summarizationModel: value,
                            })
                          }
                          disabled={!state.isEnabled || !state.summarizationProvider}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {models.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Max Tokens (Sumarização)</Label>
                      <Input
                        type="number"
                        value={state.summarizationMaxTokens}
                        onChange={(e) =>
                          updateFormState(tool.key, {
                            summarizationMaxTokens: parseInt(e.target.value) || 1000,
                          })
                        }
                        disabled={!state.isEnabled}
                        min={100}
                        max={10000}
                      />
                      <p className="text-xs text-muted-foreground">
                        Número máximo de tokens para o resumo dos resultados
                      </p>
                    </div>
                  </div>

                  {/* Configuracoes avancadas */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">
                      Configurações Avançadas
                    </Label>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tamanho Máximo do Conteúdo</Label>
                        <Input
                          type="number"
                          value={state.maxContentLength}
                          onChange={(e) =>
                            updateFormState(tool.key, {
                              maxContentLength: parseInt(e.target.value) || 10000,
                            })
                          }
                          disabled={!state.isEnabled}
                          min={1000}
                          max={100000}
                        />
                        <p className="text-xs text-muted-foreground">
                          Caracteres máximos por resultado
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Máximo de Retentativas</Label>
                        <Input
                          type="number"
                          value={state.maxOutputRetries}
                          onChange={(e) =>
                            updateFormState(tool.key, {
                              maxOutputRetries: parseInt(e.target.value) || 3,
                            })
                          }
                          disabled={!state.isEnabled}
                          min={1}
                          max={10}
                        />
                        <p className="text-xs text-muted-foreground">
                          Tentativas em caso de erro
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => handleSave(tool.key)}
                      disabled={state.saving}
                    >
                      {state.saving && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {existingConfig ? "Salvar Alterações" : "Criar Configuração"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
