"use client";

import { useState, FormEvent } from "react";
import { useAuth } from "@/providers/Auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoSVG } from "@/components/icons/logo";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) return;

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem", {
        description: "Por favor, verifique se as senhas são idênticas.",
      });
      return;
    }

    if (password.length < 6) {
      toast.error("Senha muito curta", {
        description: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password);

    if (error) {
      toast.error("Falha no cadastro", {
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    toast.success("Cadastro realizado!", {
      description: "Verifique seu e-mail para confirmar sua conta.",
    });

    // Redirect to sign in page
    router.push("/sign-in");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 flex flex-col items-center">
          <div className="flex items-center gap-1">
            <LogoSVG width={40} height={40} className="translate-y-0.5" />
            <h1 className="text-3xl font-bold tracking-tight">Pinechat</h1>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">Criar conta</CardTitle>
            <CardDescription className="mt-2">
              Cadastre-se para começar a usar o Pinechat
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Endereço de e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Digite sua senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email.trim() || !password.trim() || !confirmPassword.trim()}
            >
              {isLoading ? "Cadastrando..." : "Criar conta"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/sign-in" className="text-primary hover:underline font-medium">
              Entre
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
