"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, ArrowLeft, Check, Eye, EyeOff, Trash2, Plus } from "lucide-react";

type ModelProviderType = "OPENAI" | "OPENROUTER" | "ANTHROPIC" | "GOOGLE";

interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

interface ModelProviderConfig {
  id: string;
  provider: ModelProviderType;
  isActive: boolean;
}

const MODEL_PROVIDERS: { value: ModelProviderType; label: string; placeholder: string }[] = [
  { value: "OPENAI", label: "OpenAI", placeholder: "sk-..." },
  { value: "OPENROUTER", label: "OpenRouter", placeholder: "sk-or-..." },
  { value: "ANTHROPIC", label: "Anthropic", placeholder: "sk-ant-..." },
  { value: "GOOGLE", label: "Google AI", placeholder: "AIza..." },
];

export default function SettingsPage() {
  const router = useRouter();
  const { isLoggedIn, isLoading, hasOrganization, hasPermission, refreshSession } = useAuth();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estados para Model Providers
  const [modelProviders, setModelProviders] = useState<ModelProviderConfig[]>([]);
  const [defaultProvider, setDefaultProvider] = useState<ModelProviderType | null>(null);
  const [newProviderType, setNewProviderType] = useState<ModelProviderType | "">("");
  const [newApiKey, setNewApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [providerSuccess, setProviderSuccess] = useState(false);

  const canManage = hasPermission("ORGANIZATION_MANAGE");

  // Redirect if not authenticated or no permission
  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        router.push("/login");
      } else if (!hasOrganization) {
        router.push("/onboarding");
      } else if (!canManage) {
        router.push("/");
      }
    }
  }, [isLoading, isLoggedIn, hasOrganization, canManage, router]);

  // Load organization data
  const loadOrganization = useCallback(async () => {
    try {
      const response = await fetch("/api/organizations/settings");
      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        setName(data.organization.name);
        setSlug(data.organization.slug);
      }
    } catch (error) {
      console.error("Failed to load organization:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load model providers
  const loadModelProviders = useCallback(async () => {
    try {
      const response = await fetch("/api/organizations/model-providers");
      if (response.ok) {
        const data = await response.json();
        setModelProviders(data.providers);
        setDefaultProvider(data.defaultProvider);
      }
    } catch (error) {
      console.error("Failed to load model providers:", error);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn && hasOrganization && canManage) {
      loadOrganization();
      loadModelProviders();
    }
  }, [isLoggedIn, hasOrganization, canManage, loadOrganization, loadModelProviders]);

  // Adicionar ou atualizar provedor
  const handleAddProvider = async () => {
    if (!newProviderType || !newApiKey.trim()) {
      setProviderError("Selecione um provedor e insira a API Key");
      return;
    }

    setProviderError(null);
    setProviderSuccess(false);
    setSavingProvider(true);

    try {
      const response = await fetch("/api/organizations/model-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: newProviderType, apiKey: newApiKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        setProviderError(data.error);
        return;
      }

      setProviderSuccess(true);
      setNewProviderType("");
      setNewApiKey("");
      setShowApiKey(false);
      await loadModelProviders();

      setTimeout(() => setProviderSuccess(false), 3000);
    } catch {
      setProviderError("Erro ao salvar provedor");
    } finally {
      setSavingProvider(false);
    }
  };

  // Remover provedor
  const handleRemoveProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/organizations/model-providers/${providerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadModelProviders();
      }
    } catch (error) {
      console.error("Failed to remove provider:", error);
    }
  };

  // Definir provedor padrao
  const handleSetDefaultProvider = async (provider: ModelProviderType | null) => {
    try {
      const response = await fetch("/api/organizations/model-providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultProvider: provider }),
      });

      if (response.ok) {
        setDefaultProvider(provider);
      }
    } catch (error) {
      console.error("Failed to set default provider:", error);
    }
  };

  // Provedores disponiveis para adicionar (que ainda nao foram configurados)
  const availableProviders = MODEL_PROVIDERS.filter(
    (p) => !modelProviders.some((mp) => mp.provider === p.value)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch("/api/organizations/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        setSaving(false);
        return;
      }

      setOrganization(data.organization);
      setSuccess(true);

      // Refresh session to update org name in header
      await refreshSession();

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    organization && (name !== organization.name || slug !== organization.slug);

  if (isLoading || !isLoggedIn || !hasOrganization || !canManage) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex-1 overflow-auto">
        <div className="container max-w-2xl mx-auto py-6 px-4">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Configurações</h1>
              <p className="text-muted-foreground">
                Gerencie as configurações da sua organização
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Informações da Organização</CardTitle>
              <CardDescription>
                Altere o nome e identificador da sua organização
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 rounded-md flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Configurações salvas com sucesso!
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Organização</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Minha Empresa"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Identificador (slug)</Label>
                    <Input
                      id="slug"
                      type="text"
                      placeholder="minha-empresa"
                      value={slug}
                      onChange={(e) =>
                        setSlug(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Apenas letras minúsculas, números e hífens. Usado como
                      identificador único.
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={saving || !hasChanges}
                    >
                      {saving ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Card de Provedores de LLM */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Provedores de LLM</CardTitle>
              <CardDescription>
                Configure as API Keys dos provedores de IA que deseja utilizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lista de provedores configurados */}
              {modelProviders.length > 0 && (
                <div className="space-y-3">
                  <Label>Provedores Configurados</Label>
                  <div className="space-y-2">
                    {modelProviders.map((provider) => {
                      const providerInfo = MODEL_PROVIDERS.find(
                        (p) => p.value === provider.provider
                      );
                      return (
                        <div
                          key={provider.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {providerInfo?.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                API Key configurada
                              </span>
                            </div>
                            {defaultProvider === provider.provider && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                Padrão
                              </span>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveProvider(provider.id)}
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

              {/* Seletor de provedor padrao */}
              {modelProviders.length > 0 && (
                <div className="space-y-2">
                  <Label>Provedor Padrão</Label>
                  <Select
                    value={defaultProvider ?? "none"}
                    onValueChange={(value) =>
                      handleSetDefaultProvider(
                        value === "none" ? null : (value as ModelProviderType)
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o provedor padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {modelProviders.map((provider) => {
                        const providerInfo = MODEL_PROVIDERS.find(
                          (p) => p.value === provider.provider
                        );
                        return (
                          <SelectItem
                            key={provider.provider}
                            value={provider.provider}
                          >
                            {providerInfo?.label}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    O provedor padrão será usado nas novas conversas
                  </p>
                </div>
              )}

              {/* Formulario para adicionar novo provedor */}
              {availableProviders.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <Label>Adicionar Provedor</Label>

                  {providerError && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                      {providerError}
                    </div>
                  )}

                  {providerSuccess && (
                    <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 rounded-md flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Provedor configurado com sucesso!
                    </div>
                  )}

                  <div className="space-y-2">
                    <Select
                      value={newProviderType}
                      onValueChange={(value) =>
                        setNewProviderType(value as ModelProviderType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um provedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProviders.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder={
                          newProviderType
                            ? MODEL_PROVIDERS.find((p) => p.value === newProviderType)
                                ?.placeholder
                            : "Selecione um provedor primeiro"
                        }
                        value={newApiKey}
                        onChange={(e) => setNewApiKey(e.target.value)}
                        disabled={!newProviderType}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowApiKey(!showApiKey)}
                        disabled={!newProviderType}
                      >
                        {showApiKey ? (
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
                    onClick={handleAddProvider}
                    disabled={savingProvider || !newProviderType || !newApiKey}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {savingProvider ? "Salvando..." : "Adicionar Provedor"}
                  </Button>
                </div>
              )}

              {availableProviders.length === 0 && modelProviders.length > 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Todos os provedores disponíveis já foram configurados
                </p>
              )}

              {modelProviders.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum provedor configurado. Adicione um provedor para começar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
