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
import { HardDrive, Check, AlertCircle } from "lucide-react";

interface StorageConfig {
  bucket?: string;
  region?: string;
}

export default function StoragePage() {
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
  const [localBucket, setLocalBucket] = useState<string | null>(null);
  const [localRegion, setLocalRegion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canManage = hasPermission("ORGANIZATION_MANAGE");

  // Busca o provider S3 configurado (para verificar se credenciais existem)
  const s3Provider = getProvidersByType("STORAGE").find(
    (p) => p.provider === "AWS_S3"
  );

  // Busca a config de storage existente
  const storageConfig = getConfig("FEATURE", "STORAGE");

  // Valores derivados: usa local se modificado, senao usa config
  const configData = useMemo(() => {
    return (storageConfig?.config as StorageConfig) || {};
  }, [storageConfig]);

  const bucket = localBucket ?? configData.bucket ?? "";
  const region = localRegion ?? configData.region ?? "";

  // Redirect se sem permissão
  useEffect(() => {
    if (!authLoading && !canManage) {
      router.push("/");
    }
  }, [authLoading, canManage, router]);

  const handleSave = async () => {
    if (!bucket.trim()) {
      setError("O bucket é obrigatório");
      return;
    }
    if (!region.trim()) {
      setError("A região é obrigatória");
      return;
    }

    if (!s3Provider) {
      setError("Configure primeiro as credenciais do S3 na página de Provedores");
      return;
    }

    setSaving(true);
    setError(null);

    const config = {
      bucket: bucket.trim(),
      region: region.trim(),
    };

    // Se já existe config, atualiza; senão, cria nova
    const result = storageConfig
      ? await updateConfig("FEATURE", "STORAGE", true, config)
      : await createConfig("FEATURE", "STORAGE", true, config);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      // Limpa estados locais para usar valores da config atualizada
      setLocalBucket(null);
      setLocalRegion(null);
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  const isLoading = authLoading || providersLoading || configsLoading;

  if (isLoading || !canManage) {
    return null;
  }

  const hasCredentials = !!s3Provider;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <HardDrive className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Armazenamento</h1>
            <p className="text-muted-foreground">
              Configure o armazenamento para upload de documentos
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Amazon S3</CardTitle>
            <CardDescription>
              Configure o bucket e região para armazenar os documentos das coleções
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!hasCredentials && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Credenciais não configuradas
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Configure primeiro as credenciais do AWS S3 na{" "}
                    <button
                      onClick={() => router.push("/settings/providers")}
                      className="underline hover:no-underline"
                    >
                      página de Provedores
                    </button>
                    .
                  </p>
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bucket">Bucket</Label>
                <Input
                  id="bucket"
                  placeholder="meu-bucket"
                  value={bucket}
                  onChange={(e) => setLocalBucket(e.target.value)}
                  disabled={!hasCredentials || saving}
                />
                <p className="text-xs text-muted-foreground">
                  Nome do bucket S3 onde os documentos serão armazenados
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Região</Label>
                <Input
                  id="region"
                  placeholder="us-east-1"
                  value={region}
                  onChange={(e) => setLocalRegion(e.target.value)}
                  disabled={!hasCredentials || saving}
                />
                <p className="text-xs text-muted-foreground">
                  Região AWS onde o bucket está localizado
                </p>
              </div>

              <Button
                onClick={handleSave}
                disabled={!hasCredentials || saving || (!bucket && !region)}
              >
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
