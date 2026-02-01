"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";

function VerifyPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(
        () => setCooldownSeconds(cooldownSeconds - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleResend = useCallback(async () => {
    if (!email || cooldownSeconds > 0) return;

    setResending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await api.post<{ message: string }>(
        "/auth/resend-verification",
        { email }
      );

      if (response.error) {
        // Verificar se e rate limit (429)
        if (response.status === 429) {
          setError(response.error);
          setCooldownSeconds(60);
        } else {
          setError(response.error);
        }
        return;
      }

      setMessage("Email enviado! Verifique sua caixa de entrada.");
      setCooldownSeconds(60);
    } catch {
      setError("Erro ao reenviar email");
    } finally {
      setResending(false);
    }
  }, [email, cooldownSeconds]);

  if (!email) {
    router.push("/auth/signup");
    return null;
  }

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
            <div className="p-3 bg-primary/10 rounded-full">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Verifique seu Email
          </CardTitle>
          <CardDescription className="text-center">
            Enviamos um link de verificacao para:
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 rounded-md text-center">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md text-center">
              {error}
            </div>
          )}
          <p className="text-sm text-muted-foreground text-center">
            Clique no link no email para ativar sua conta. O link expira em 24
            horas.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={resending || cooldownSeconds > 0}
          >
            {resending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {cooldownSeconds > 0
              ? `Reenviar em ${cooldownSeconds}s`
              : "Reenviar Email"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Email errado?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline">
              Cadastrar novamente
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse">Carregando...</div>
        </div>
      }
    >
      <VerifyPendingContent />
    </Suspense>
  );
}
