"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { usePublicInvite } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, CheckCircle, XCircle, Clock } from "lucide-react";

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading } = useSession();

  // Hook para gerenciar convite
  const {
    invite: inviteInfo,
    isLoading: inviteLoading,
    error: inviteError,
    acceptInvite,
  } = usePublicInvite(token);

  // Estados locais para ação de aceitar
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    setError(null);
    setAccepting(true);

    const result = await acceptInvite();

    if (result.error) {
      setError(result.error);
      setAccepting(false);
      return;
    }

    setSuccess(true);

    // Redirecionar após 2 segundos
    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  const isLoading = inviteLoading || authLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <div className="animate-pulse text-muted-foreground">
                Carregando...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state (invite not found)
  if (inviteError && !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-destructive/10 rounded-full">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Convite Inválido
            </CardTitle>
            <CardDescription className="text-center">{inviteError}</CardDescription>
          </CardHeader>
          <CardFooter className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Voltar ao Início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Convite Aceito!
            </CardTitle>
            <CardDescription className="text-center">
              Você agora é membro de {inviteInfo?.organization.name}.
              Redirecionando...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Expired invite
  if (inviteInfo?.isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-muted rounded-full">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Convite Expirado
            </CardTitle>
            <CardDescription className="text-center">
              Este convite expirou. Solicite um novo convite ao administrador da
              organização.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Voltar ao Início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Used invite
  if (inviteInfo?.isUsed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-muted rounded-full">
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Convite Já Utilizado
            </CardTitle>
            <CardDescription className="text-center">
              Este convite já foi utilizado por outro usuário.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Voltar ao Início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Valid invite - show accept form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Convite para Organização
          </CardTitle>
          <CardDescription className="text-center">
            Você foi convidado para participar de uma organização
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organização</span>
              <span className="font-medium">{inviteInfo?.organization.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sua função</span>
              <span className="font-medium">{inviteInfo?.role.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Convidado por</span>
              <span className="font-medium">{inviteInfo?.createdBy.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expira em</span>
              <span className="font-medium">
                {inviteInfo?.expiresAt
                  ? new Date(inviteInfo.expiresAt).toLocaleDateString("pt-BR")
                  : "-"}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-2">
          {isLoggedIn ? (
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? "Aceitando..." : "Aceitar Convite"}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={() =>
                router.push(`/login?callbackUrl=/invite/${token}`)
              }
            >
              Fazer Login para Aceitar
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
