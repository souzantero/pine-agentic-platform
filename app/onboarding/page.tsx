"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useOrganization } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2 } from "lucide-react";

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { isLoggedIn, isLoading, hasOrganization } = useSession();
  const { createOrganization } = useOrganization();

  // Redirecionar baseado no estado de autenticação
  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn) {
      router.push("/login");
    } else if (hasOrganization) {
      router.push("/");
    }
  }, [isLoading, isLoggedIn, hasOrganization, router]);

  // Gerar slug automaticamente a partir do nome
  const handleNameChange = (value: string) => {
    setName(value);
    const generatedSlug = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
      .replace(/\s+/g, "-") // Substitui espaços por hífens
      .replace(/-+/g, "-") // Remove hífens duplicados
      .replace(/^-|-$/g, ""); // Remove hífens no início/fim
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!name.trim()) {
      setError("Nome da organização é obrigatório");
      setLoading(false);
      return;
    }

    if (!slug.trim()) {
      setError("Slug é obrigatório");
      setLoading(false);
      return;
    }

    if (slug.length < 3) {
      setError("Slug deve ter pelo menos 3 caracteres");
      setLoading(false);
      return;
    }

    const result = await createOrganization({
      name: name.trim(),
      slug: slug.trim(),
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/");
  };

  // Mostrar loading enquanto verifica autenticação
  if (isLoading || !isLoggedIn || hasOrganization) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Criar Organização
          </CardTitle>
          <CardDescription className="text-center">
            Crie sua organização para começar a usar o Pine Chat
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Organização</Label>
              <Input
                id="name"
                type="text"
                placeholder="Minha Empresa"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
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
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "")
                  )
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e hífens. Será usado na URL.
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Criando..." : "Criar Organização"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
