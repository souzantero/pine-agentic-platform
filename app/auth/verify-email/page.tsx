"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { setToken } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { refreshSession } = useSession();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [error, setError] = useState<string | null>(null);

  const verifyToken = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setError("Token de verificacao nao encontrado");
      return;
    }

    try {
      const response = await api.post<{ accessToken: string }>(
        "/auth/verify-email",
        { token }
      );

      if (response.error) {
        setStatus("error");
        setError(response.error);
        return;
      }

      if (response.data?.accessToken) {
        // Salvar token e carregar sessao
        setToken(response.data.accessToken);
        await refreshSession();
        setStatus("success");

        // Redirecionar apos 2 segundos
        setTimeout(() => {
          router.push("/chat/onboarding");
        }, 2000);
      }
    } catch {
      setStatus("error");
      setError("Erro ao verificar email");
    }
  }, [token, refreshSession, router]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Verificando seu email...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Link
          href="/"
          className="mb-8 text-2xl font-bold hover:opacity-80 transition-opacity"
        >
          PineAI
        </Link>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-destructive/10 rounded-full">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Verificacao Falhou
            </CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button
              className="w-full"
              onClick={() => router.push("/auth/signup")}
            >
              Cadastrar Novamente
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/auth/login")}
            >
              Ir para Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <Link
        href="/"
        className="mb-8 text-2xl font-bold hover:opacity-80 transition-opacity"
      >
        PineAI
      </Link>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Email Verificado!
          </CardTitle>
          <CardDescription className="text-center">
            Sua conta foi ativada com sucesso. Redirecionando...
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse">Carregando...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
