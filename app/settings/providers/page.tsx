"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useProviders } from "@/lib/hooks";
import { PROVIDER_TYPES } from "@/lib/types";
import type { Provider, ProviderType, ProviderInfo } from "@/lib/types";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plug, Check, Eye, EyeOff, Trash2, Plus } from "lucide-react";

interface ProviderFormState {
  selectedProvider: Provider | "";
  apiKey: string;
  showApiKey: boolean;
  saving: boolean;
  error: string | null;
  success: boolean;
  // Campos extras para provedores que precisam de config adicional (ex: S3)
  extraConfig: Record<string, string>;
}

const initialFormState: ProviderFormState = {
  selectedProvider: "",
  apiKey: "",
  showApiKey: false,
  saving: false,
  error: null,
  success: false,
  extraConfig: {},
};

// Campos extras necessarios para cada provedor (apenas credenciais)
const PROVIDER_EXTRA_FIELDS: Record<Provider, { key: string; label: string; placeholder: string }[]> = {
  AWS_S3: [
    { key: "accessKeyId", label: "Access Key ID", placeholder: "AKIA..." },
  ],
  OPENAI: [],
  OPENROUTER: [],
  ANTHROPIC: [],
  GOOGLE: [],
  TAVILY: [],
};

export default function ProvidersPage() {
  const router = useRouter();
  const { isLoading: authLoading, hasPermission } = useSession();

  const {
    isLoading: providersLoading,
    addProvider,
    removeProvider,
    getProvidersByType,
  } = useProviders();

  // Estado do formulário para cada tipo de provedor
  const [formStates, setFormStates] = useState<
    Record<ProviderType, ProviderFormState>
  >({
    LLM: { ...initialFormState },
    WEB_SEARCH: { ...initialFormState },
    STORAGE: { ...initialFormState },
    EMBEDDING: { ...initialFormState },
  });

  const canManage = hasPermission("ORGANIZATION_MANAGE");

  // Redirect se sem permissão
  useEffect(() => {
    if (!authLoading && !canManage) {
      router.push("/");
    }
  }, [authLoading, canManage, router]);

  // Handlers
  const updateFormState = (
    type: ProviderType,
    updates: Partial<ProviderFormState>
  ) => {
    setFormStates((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...updates },
    }));
  };

  const handleAddProvider = async (type: ProviderType) => {
    const state = formStates[type];
    if (!state.selectedProvider || !state.apiKey.trim()) {
      updateFormState(type, {
        error: "Selecione um provedor e insira a API Key",
      });
      return;
    }

    // Valida campos extras obrigatorios
    const extraFields = PROVIDER_EXTRA_FIELDS[state.selectedProvider] || [];
    for (const field of extraFields) {
      if (!state.extraConfig[field.key]?.trim()) {
        updateFormState(type, {
          error: `O campo "${field.label}" é obrigatório`,
        });
        return;
      }
    }

    updateFormState(type, { error: null, success: false, saving: true });

    // Monta objeto credentials combinando apiKey + campos extras
    const credentials: Record<string, string> = {
      apiKey: state.apiKey.trim(),
      ...state.extraConfig,
    };

    const result = await addProvider(
      type,
      state.selectedProvider,
      credentials
    );

    if (result.error) {
      updateFormState(type, { error: result.error, saving: false });
    } else {
      updateFormState(type, {
        success: true,
        selectedProvider: "",
        apiKey: "",
        showApiKey: false,
        saving: false,
        extraConfig: {},
      });
      setTimeout(() => updateFormState(type, { success: false }), 3000);
    }
  };

  const handleRemoveProvider = async (type: ProviderType, providerId: string) => {
    const result = await removeProvider(providerId);
    if (result.error) {
      updateFormState(type, { error: result.error });
    }
  };

  // Obter provedores disponíveis para um tipo
  const getAvailableProviders = (type: ProviderType): ProviderInfo[] => {
    const typeInfo = PROVIDER_TYPES.find((pt) => pt.value === type);
    if (!typeInfo) return [];

    const configuredProviders = getProvidersByType(type);
    return typeInfo.providers.filter(
      (p) => !configuredProviders.some((cp) => cp.provider === p.value)
    );
  };

  const isLoading = authLoading || providersLoading;

  if (isLoading || !canManage) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Plug className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Provedores</h1>
            <p className="text-muted-foreground">
              Configure as API Keys dos provedores que deseja utilizar
            </p>
          </div>
        </div>

        <Tabs defaultValue="LLM" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {PROVIDER_TYPES.map((pt) => (
              <TabsTrigger key={pt.value} value={pt.value}>
                {pt.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {PROVIDER_TYPES.map((providerType) => {
            const configuredProviders = getProvidersByType(providerType.value);
            const availableProviders = getAvailableProviders(providerType.value);
            const state = formStates[providerType.value];

            return (
              <TabsContent key={providerType.value} value={providerType.value}>
                <Card>
                  <CardHeader>
                    <CardTitle>{providerType.label}</CardTitle>
                    <CardDescription>{providerType.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Lista de provedores configurados */}
                    {configuredProviders.length > 0 && (
                      <div className="space-y-3">
                        <Label>Provedores Configurados</Label>
                        <div className="space-y-2">
                          {configuredProviders.map((provider) => {
                            const providerInfo = providerType.providers.find(
                              (p) => p.value === provider.provider
                            );
                            return (
                              <div
                                key={provider.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                              >
                                <div className="flex flex-col gap-1">
                                  <span className="font-medium">
                                    {providerInfo?.label || provider.provider}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Credenciais configuradas
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleRemoveProvider(
                                      providerType.value,
                                      provider.id
                                    )
                                  }
                                  title="Remover provedor"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Formulário para adicionar novo provedor */}
                    {availableProviders.length > 0 && (
                      <div className="space-y-4 pt-4 border-t">
                        <Label>Adicionar Provedor</Label>

                        {state.error && (
                          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                            {state.error}
                          </div>
                        )}

                        {state.success && (
                          <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 rounded-md flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            Provedor configurado com sucesso!
                          </div>
                        )}

                        <div className="space-y-2">
                          <Select
                            value={state.selectedProvider}
                            onValueChange={(value) =>
                              updateFormState(providerType.value, {
                                selectedProvider: value as Provider,
                                extraConfig: {},
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um provedor" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProviders.map((provider) => (
                                <SelectItem
                                  key={provider.value}
                                  value={provider.value}
                                >
                                  {provider.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Campos extras para provedores que precisam de config adicional */}
                        {state.selectedProvider &&
                          PROVIDER_EXTRA_FIELDS[state.selectedProvider]?.map(
                            (field) => (
                              <div key={field.key} className="space-y-2">
                                <Label htmlFor={`${providerType.value}-${field.key}`}>
                                  {field.label}
                                </Label>
                                <Input
                                  id={`${providerType.value}-${field.key}`}
                                  placeholder={field.placeholder}
                                  value={state.extraConfig[field.key] || ""}
                                  onChange={(e) =>
                                    updateFormState(providerType.value, {
                                      extraConfig: {
                                        ...state.extraConfig,
                                        [field.key]: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </div>
                            )
                          )}

                        <div className="space-y-2">
                          <Label>
                            {state.selectedProvider === "AWS_S3"
                              ? "Secret Access Key"
                              : "API Key"}
                          </Label>
                          <div className="relative">
                            <Input
                              type={state.showApiKey ? "text" : "password"}
                              placeholder={
                                state.selectedProvider
                                  ? availableProviders.find(
                                      (p) => p.value === state.selectedProvider
                                    )?.placeholder
                                  : "Selecione um provedor primeiro"
                              }
                              value={state.apiKey}
                              onChange={(e) =>
                                updateFormState(providerType.value, {
                                  apiKey: e.target.value,
                                })
                              }
                              disabled={!state.selectedProvider}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() =>
                                updateFormState(providerType.value, {
                                  showApiKey: !state.showApiKey,
                                })
                              }
                              disabled={!state.selectedProvider}
                            >
                              {state.showApiKey ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            A API Key será armazenada de forma segura
                          </p>
                        </div>

                        <Button
                          onClick={() => handleAddProvider(providerType.value)}
                          disabled={
                            state.saving ||
                            !state.selectedProvider ||
                            !state.apiKey
                          }
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {state.saving ? "Salvando..." : "Adicionar Provedor"}
                        </Button>
                      </div>
                    )}

                    {availableProviders.length === 0 &&
                      configuredProviders.length > 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Todos os provedores disponíveis já foram configurados
                        </p>
                      )}

                    {configuredProviders.length === 0 &&
                      availableProviders.length > 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum provedor configurado. Adicione um provedor para
                          começar.
                        </p>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </AppLayout>
  );
}
