"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useProviders, useConfigs } from "@/lib/hooks";
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
import { Brain, Check, AlertCircle, Scissors, Sparkles } from "lucide-react";

interface KnowledgeConfig {
  storage?: {
    provider?: string;
    bucket?: string;
    region?: string;
  };
  embedding?: {
    provider?: string;
    model?: string;
  };
  chunking?: {
    strategy?: string;
    chunkSize?: number;
    chunkOverlap?: number;
    breakpointThresholdType?: string;
  };
}

// Estrategias de chunking
const CHUNKING_STRATEGIES = [
  {
    value: "RECURSIVE",
    label: "Recursivo",
    description: "Divide o texto por tamanho usando separadores naturais (parágrafos, frases)",
  },
  {
    value: "SEMANTIC",
    label: "Semântico",
    description: "Divide o texto por similaridade semântica usando embeddings",
  },
];

// Tipos de threshold para chunking semantico
const BREAKPOINT_THRESHOLD_TYPES = [
  {
    value: "percentile",
    label: "Percentil",
    description: "Usa o percentil da distribuição de distâncias",
  },
  {
    value: "standard_deviation",
    label: "Desvio Padrão",
    description: "Usa o desvio padrão das distâncias",
  },
  {
    value: "interquartile",
    label: "Interquartil",
    description: "Usa o intervalo interquartil das distâncias",
  },
];

// Modelos de embedding por provider
const EMBEDDING_MODELS: Record<string, { value: string; label: string }[]> = {
  OPENAI: [
    { value: "text-embedding-ada-002", label: "text-embedding-ada-002" },
    { value: "text-embedding-3-small", label: "text-embedding-3-small" },
    { value: "text-embedding-3-large", label: "text-embedding-3-large" },
  ],
};

// Valores padrao
const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;
const DEFAULT_CHUNKING_STRATEGY = "RECURSIVE";
const DEFAULT_BREAKPOINT_THRESHOLD_TYPE = "percentile";

export default function KnowledgePage() {
  const router = useRouter();
  const { isLoading: authLoading, hasPermission } = useSession();
  const { isLoading: providersLoading, getProvidersByType } = useProviders();
  const {
    isLoading: configsLoading,
    getConfig,
    createConfig,
    updateConfig,
  } = useConfigs("FEATURE");

  // Estados locais do form, null significa "usar valor da config"
  // Storage
  const [localStorageProvider, setLocalStorageProvider] = useState<string | null>(null);
  const [localBucket, setLocalBucket] = useState<string | null>(null);
  const [localRegion, setLocalRegion] = useState<string | null>(null);
  // Embedding
  const [localEmbeddingProvider, setLocalEmbeddingProvider] = useState<string | null>(null);
  const [localEmbeddingModel, setLocalEmbeddingModel] = useState<string | null>(null);
  // Chunking
  const [localChunkingStrategy, setLocalChunkingStrategy] = useState<string | null>(null);
  const [localChunkSize, setLocalChunkSize] = useState<number | null>(null);
  const [localChunkOverlap, setLocalChunkOverlap] = useState<number | null>(null);
  const [localBreakpointThresholdType, setLocalBreakpointThresholdType] = useState<string | null>(null);
  // UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canManage = hasPermission("ORGANIZATION_MANAGE");

  // Busca os providers configurados
  const storageProviders = getProvidersByType("STORAGE");
  const embeddingProviders = getProvidersByType("EMBEDDING");

  // Busca a config de conhecimento existente
  const knowledgeConfig = getConfig("FEATURE", "KNOWLEDGE");

  // Valores derivados: usa local se modificado, senao usa config
  const configData = useMemo(() => {
    return (knowledgeConfig?.config as KnowledgeConfig) || {};
  }, [knowledgeConfig]);

  // Storage values
  const storageProvider = localStorageProvider ?? configData.storage?.provider ?? "";
  const bucket = localBucket ?? configData.storage?.bucket ?? "";
  const region = localRegion ?? configData.storage?.region ?? "";

  // Embedding values
  const embeddingProvider = localEmbeddingProvider ?? configData.embedding?.provider ?? "";
  const embeddingModel = localEmbeddingModel ?? configData.embedding?.model ?? "";

  // Chunking values
  const chunkingStrategy = localChunkingStrategy ?? configData.chunking?.strategy ?? DEFAULT_CHUNKING_STRATEGY;
  const chunkSize = localChunkSize ?? configData.chunking?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const chunkOverlap = localChunkOverlap ?? configData.chunking?.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP;
  const breakpointThresholdType = localBreakpointThresholdType ?? configData.chunking?.breakpointThresholdType ?? DEFAULT_BREAKPOINT_THRESHOLD_TYPE;

  // Modelos disponiveis para o provider selecionado
  const availableModels = embeddingProvider ? EMBEDDING_MODELS[embeddingProvider] || [] : [];

  // Redirect se sem permissao
  useEffect(() => {
    if (!authLoading && !canManage) {
      router.push("/");
    }
  }, [authLoading, canManage, router]);

  // Quando muda o provider de embedding, limpa o modelo se nao for compativel
  useEffect(() => {
    if (embeddingProvider && availableModels.length > 0) {
      const modelExists = availableModels.some(m => m.value === embeddingModel);
      if (!modelExists) {
        setLocalEmbeddingModel(availableModels[0].value);
      }
    }
  }, [embeddingProvider, availableModels, embeddingModel]);

  const handleSave = async () => {
    if (!storageProvider) {
      setError("Selecione um provedor de armazenamento");
      return;
    }
    if (!bucket.trim()) {
      setError("O bucket é obrigatório");
      return;
    }
    if (!region.trim()) {
      setError("A região é obrigatória");
      return;
    }
    if (!embeddingProvider) {
      setError("Selecione um provedor de embedding");
      return;
    }
    if (!embeddingModel) {
      setError("Selecione um modelo de embedding");
      return;
    }

    // Validacoes especificas por estrategia
    if (chunkingStrategy === "RECURSIVE") {
      if (chunkSize < 100 || chunkSize > 10000) {
        setError("O tamanho do chunk deve estar entre 100 e 10000");
        return;
      }
      if (chunkOverlap < 0 || chunkOverlap >= chunkSize) {
        setError("O overlap deve ser maior ou igual a 0 e menor que o tamanho do chunk");
        return;
      }
    }

    setSaving(true);
    setError(null);

    const config: KnowledgeConfig = {
      storage: {
        provider: storageProvider,
        bucket: bucket.trim(),
        region: region.trim(),
      },
      embedding: {
        provider: embeddingProvider,
        model: embeddingModel,
      },
      chunking: {
        strategy: chunkingStrategy,
        chunkSize,
        chunkOverlap,
        breakpointThresholdType,
      },
    };

    // Se ja existe config, atualiza; senao, cria nova
    const result = knowledgeConfig
      ? await updateConfig("FEATURE", "KNOWLEDGE", true, config as Record<string, unknown>)
      : await createConfig("FEATURE", "KNOWLEDGE", true, config as Record<string, unknown>);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      // Limpa estados locais para usar valores da config atualizada
      setLocalStorageProvider(null);
      setLocalBucket(null);
      setLocalRegion(null);
      setLocalEmbeddingProvider(null);
      setLocalEmbeddingModel(null);
      setLocalChunkingStrategy(null);
      setLocalChunkSize(null);
      setLocalChunkOverlap(null);
      setLocalBreakpointThresholdType(null);
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  const isLoading = authLoading || providersLoading || configsLoading;

  if (isLoading || !canManage) {
    return null;
  }

  const hasStorageProviders = storageProviders.length > 0;
  const hasEmbeddingProviders = embeddingProviders.length > 0;
  const canSave = hasStorageProviders && hasEmbeddingProviders && storageProvider && embeddingProvider;

  // Encontra a estrategia selecionada para mostrar descricao
  const selectedStrategy = CHUNKING_STRATEGIES.find(s => s.value === chunkingStrategy);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Conhecimento</h1>
            <p className="text-muted-foreground">
              Configure o armazenamento e processamento de documentos
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Alertas de credenciais faltando */}
          {(!hasStorageProviders || !hasEmbeddingProviders) && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Provedores necessários
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 list-disc list-inside">
                  {!hasStorageProviders && (
                    <li>Armazenamento (ex: AWS S3)</li>
                  )}
                  {!hasEmbeddingProviders && (
                    <li>Embeddings (ex: OpenAI)</li>
                  )}
                </ul>
                <button
                  onClick={() => router.push("/settings/providers")}
                  className="text-sm text-amber-800 dark:text-amber-200 underline hover:no-underline mt-2"
                >
                  Configurar na página de Provedores
                </button>
              </div>
            </div>
          )}

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

          {/* Card de Armazenamento */}
          <Card>
            <CardHeader>
              <CardTitle>Armazenamento</CardTitle>
              <CardDescription>
                Configure onde os arquivos dos documentos serão armazenados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storage-provider">Provedor</Label>
                <Select
                  value={storageProvider}
                  onValueChange={setLocalStorageProvider}
                  disabled={!hasStorageProviders || saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.provider}>
                        {provider.provider === "AWS_S3" ? "Amazon S3" : provider.provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {storageProvider === "AWS_S3" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bucket">Bucket S3</Label>
                    <Input
                      id="bucket"
                      placeholder="meu-bucket"
                      value={bucket}
                      onChange={(e) => setLocalBucket(e.target.value)}
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Nome do bucket S3 onde os documentos serão armazenados
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Região AWS</Label>
                    <Input
                      id="region"
                      placeholder="us-east-1"
                      value={region}
                      onChange={(e) => setLocalRegion(e.target.value)}
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Região AWS onde o bucket está localizado
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card de Vetorizacao */}
          <Card>
            <CardHeader>
              <CardTitle>Vetorização</CardTitle>
              <CardDescription>
                Configure o modelo de embedding para busca semântica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="embedding-provider">Provedor</Label>
                <Select
                  value={embeddingProvider}
                  onValueChange={setLocalEmbeddingProvider}
                  disabled={!hasEmbeddingProviders || saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {embeddingProviders.map((provider) => (
                      <SelectItem key={provider.id} value={provider.provider}>
                        {provider.provider === "OPENAI" ? "OpenAI" : provider.provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {embeddingProvider && availableModels.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="embedding-model">Modelo de Embedding</Label>
                  <Select
                    value={embeddingModel}
                    onValueChange={setLocalEmbeddingModel}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Modelo usado para converter texto em vetores para busca semântica
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Chunking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Chunking
              </CardTitle>
              <CardDescription>
                Configure como os documentos serão divididos em partes menores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chunking-strategy">Estratégia</Label>
                <Select
                  value={chunkingStrategy}
                  onValueChange={setLocalChunkingStrategy}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma estratégia" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHUNKING_STRATEGIES.map((strategy) => (
                      <SelectItem key={strategy.value} value={strategy.value}>
                        <div className="flex items-center gap-2">
                          {strategy.value === "SEMANTIC" && <Sparkles className="h-4 w-4" />}
                          {strategy.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedStrategy && (
                  <p className="text-xs text-muted-foreground">
                    {selectedStrategy.description}
                  </p>
                )}
              </div>

              {/* Campos para estrategia RECURSIVE */}
              {chunkingStrategy === "RECURSIVE" && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="chunk-size">Tamanho do Chunk</Label>
                    <Input
                      id="chunk-size"
                      type="number"
                      min={100}
                      max={10000}
                      value={chunkSize}
                      onChange={(e) => setLocalChunkSize(parseInt(e.target.value) || DEFAULT_CHUNK_SIZE)}
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Caracteres por chunk (100-10000)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chunk-overlap">Overlap</Label>
                    <Input
                      id="chunk-overlap"
                      type="number"
                      min={0}
                      max={chunkSize - 1}
                      value={chunkOverlap}
                      onChange={(e) => setLocalChunkOverlap(parseInt(e.target.value) || 0)}
                      disabled={saving}
                    />
                    <p className="text-xs text-muted-foreground">
                      Sobreposição entre chunks
                    </p>
                  </div>
                </div>
              )}

              {/* Campos para estrategia SEMANTIC */}
              {chunkingStrategy === "SEMANTIC" && (
                <div className="pt-4 border-t space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-md flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      O chunking semântico usa o modelo de embedding configurado acima para
                      dividir o texto em partes com significado coerente.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="breakpoint-threshold-type">Tipo de Threshold</Label>
                    <Select
                      value={breakpointThresholdType}
                      onValueChange={setLocalBreakpointThresholdType}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {BREAKPOINT_THRESHOLD_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {BREAKPOINT_THRESHOLD_TYPES.find(t => t.value === breakpointThresholdType)?.description}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full"
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
