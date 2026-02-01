"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/session";
import { api } from "@/lib/api";
import { validatePassword } from "@/lib/password";
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
import { PasswordStrength } from "@/components/ui/password-strength";
import { ArrowLeft, Check } from "lucide-react";

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useSession();

  // Estados do formulario de alteracao de senha
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validation = validatePassword(newPassword);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validacoes
    if (!validation.isValid) {
      setError("A senha nao atende aos requisitos minimos");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas nao coincidem");
      return;
    }

    setSaving(true);

    const response = await api.post<{ message: string }>("/auth/change-password", {
      currentPassword,
      newPassword,
    });

    if (response.error) {
      setError(response.error);
    } else {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  if (authLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header simples */}
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Minha Conta</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie suas informacoes pessoais
            </p>
          </div>
        </div>
      </header>

      {/* Conteudo */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Informacoes do usuario */}
        <Card>
          <CardHeader>
            <CardTitle>Informacoes</CardTitle>
            <CardDescription>Seus dados de conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={user?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Alteracao de senha */}
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>
              Atualize sua senha de acesso
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/50 rounded-md flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Senha alterada com sucesso
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha atual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <PasswordStrength password={newPassword} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <div className="px-6 pb-6 pt-2">
              <Button
                type="submit"
                disabled={saving || !validation.isValid || !currentPassword}
              >
                {saving ? "Salvando..." : "Alterar Senha"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
