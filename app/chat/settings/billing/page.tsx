"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/session";
import { useBilling } from "@/lib/hooks";
import { AppLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard,
  Check,
  Zap,
  Users,
  Database,
  MessageSquare,
  Wrench,
  HardDrive,
  Loader2,
  Shield,
  Clock,
  AlertTriangle,
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getTrialDaysRemaining(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading: authLoading, hasPermission } = useSession();
  const { usage, isLoading, createCheckout, openPortal, refresh } =
    useBilling();

  const canManage = hasPermission("ORGANIZATION_MANAGE");
  const success = searchParams.get("success") === "true";

  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !canManage) {
      router.push("/chat");
    }
  }, [authLoading, canManage, router]);

  useEffect(() => {
    if (success) {
      refresh();
    }
  }, [success, refresh]);

  const handleUpgrade = async () => {
    setUpgradeLoading(true);
    const result = await createCheckout();
    if (result.url) {
      window.location.href = result.url;
    } else {
      setUpgradeLoading(false);
    }
  };

  const handleManage = async () => {
    setManageLoading(true);
    const result = await openPortal();
    if (result.url) {
      window.location.href = result.url;
    } else {
      setManageLoading(false);
    }
  };

  if (authLoading || isLoading || !canManage) {
    return null;
  }

  const isPro = usage?.plan === "TEAM";

  const formatLimit = (current: number, limit: number | null) => {
    if (limit === null) return `${current} / Ilimitado`;
    return `${current} / ${limit}`;
  };

  const formatStorageLimit = (current: number, limit: number | null) => {
    if (limit === null) return `${formatBytes(current)} / Ilimitado`;
    return `${formatBytes(current)} / ${formatBytes(limit)}`;
  };

  const getProgress = (current: number, limit: number | null) => {
    if (limit === null) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Plano e Uso</h1>
            <p className="text-muted-foreground">
              Gerencie seu plano e veja o uso atual
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                Upgrade realizado com sucesso!
              </span>
            </div>
          </div>
        )}

        {/* Banner de Trial */}
        {usage?.trial && !isPro && (() => {
          const daysRemaining = getTrialDaysRemaining(usage.trial.endsAt);
          const isExpired = usage.trial.expired;

          if (isExpired) {
            return (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium">
                      Seu período de teste expirou
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleUpgrade}
                    disabled={upgradeLoading}
                    className="cursor-pointer"
                  >
                    {upgradeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Fazer upgrade
                  </Button>
                </div>
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Faça upgrade para o plano Team para continuar usando o Pineai.
                </p>
              </div>
            );
          }

          if (daysRemaining !== null && daysRemaining <= 3) {
            return (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                    <Clock className="h-5 w-5" />
                    <span className="font-medium">
                      {daysRemaining === 0
                        ? "Último dia de teste"
                        : daysRemaining === 1
                          ? "1 dia restante de teste"
                          : `${daysRemaining} dias restantes de teste`}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleUpgrade}
                    disabled={upgradeLoading}
                    className="cursor-pointer"
                  >
                    {upgradeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Fazer upgrade
                  </Button>
                </div>
              </div>
            );
          }

          return null;
        })()}

        {/* Plano Atual */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isPro ? (
                    <>
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Plano Team
                    </>
                  ) : (
                    "Plano Free"
                  )}
                </CardTitle>
                <CardDescription>
                  {isPro
                    ? "Você tem acesso a todos os recursos"
                    : "Faça upgrade para desbloquear mais recursos"}
                </CardDescription>
              </div>
              {isPro ? (
                <Button
                  variant="outline"
                  onClick={handleManage}
                  disabled={manageLoading}
                  className="cursor-pointer"
                >
                  {manageLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Gerenciar Assinatura
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                  className="cursor-pointer"
                >
                  {upgradeLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Upgrade para Team - R$149/mês
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Uso Atual */}
        <Card>
          <CardHeader>
            <CardTitle>Uso Atual</CardTitle>
            <CardDescription>
              Veja quanto você está usando dos seus limites
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Membros */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Membros</span>
                </div>
                <span className="text-muted-foreground">
                  {usage &&
                    formatLimit(usage.members.current, usage.members.limit)}
                </span>
              </div>
              {usage?.members.limit && (
                <Progress
                  value={getProgress(
                    usage.members.current,
                    usage.members.limit
                  )}
                />
              )}
            </div>

            {/* Colecoes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span>Coleções de Conhecimento</span>
                </div>
                <span className="text-muted-foreground">
                  {usage &&
                    formatLimit(
                      usage.collections.current,
                      usage.collections.limit
                    )}
                </span>
              </div>
              {usage?.collections.limit && (
                <Progress
                  value={getProgress(
                    usage.collections.current,
                    usage.collections.limit
                  )}
                />
              )}
            </div>

            {/* Threads */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>Conversas</span>
                </div>
                <span className="text-muted-foreground">
                  {usage &&
                    formatLimit(usage.threads.current, usage.threads.limit)}
                </span>
              </div>
              {usage?.threads.limit && (
                <Progress
                  value={getProgress(
                    usage.threads.current,
                    usage.threads.limit
                  )}
                />
              )}
            </div>

            {/* Tool Calls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span>Chamadas de Ferramentas (mensal)</span>
                </div>
                <span className="text-muted-foreground">
                  {usage &&
                    formatLimit(
                      usage.toolCalls.current,
                      usage.toolCalls.limit
                    )}
                </span>
              </div>
              {usage?.toolCalls.limit && (
                <Progress
                  value={getProgress(
                    usage.toolCalls.current,
                    usage.toolCalls.limit
                  )}
                />
              )}
              {usage?.toolCalls.limit && (
                <p className="text-xs text-muted-foreground">
                  Reseta em{" "}
                  {new Date(usage.toolCalls.resetsAt).toLocaleDateString(
                    "pt-BR"
                  )}
                </p>
              )}
            </div>

            {/* Storage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span>Armazenamento</span>
                </div>
                <span className="text-muted-foreground">
                  {usage &&
                    formatStorageLimit(
                      usage.storage.current,
                      usage.storage.limit
                    )}
                </span>
              </div>
              {usage?.storage.limit && (
                <Progress
                  value={getProgress(
                    usage.storage.current,
                    usage.storage.limit
                  )}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comparação de Planos */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Comparação de Planos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Free</h3>
                <p className="text-xs text-muted-foreground mb-3">7 dias de teste</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>1 membro</li>
                  <li>1 coleção de conhecimento</li>
                  <li>50 conversas</li>
                  <li>200 chamadas de ferramentas/mês</li>
                  <li>100MB de armazenamento</li>
                </ul>
              </div>
              <div className={`p-4 rounded-lg ${isPro ? "border-2 border-primary" : "border"}`}>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Team <span className="text-primary text-sm">R$149/mês</span>
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    10 membros
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    10 coleções de conhecimento
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    1.000 conversas/mês
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    5.000 chamadas de ferramentas/mês
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    5GB de armazenamento
                  </li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  Enterprise
                  <Shield className="h-4 w-4 text-blue-500" />
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Membros ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Tudo do Team
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Armazenamento custom
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Suporte prioritário
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    SLA garantido
                  </li>
                </ul>
                <a
                  href="mailto:ai@pine.net.br"
                  className="mt-4 block text-center text-sm text-primary hover:underline"
                >
                  Falar com vendas
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
