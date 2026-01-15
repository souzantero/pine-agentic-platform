"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { useOrganization } from "@/lib/hooks";
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
import { Building2, Check } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const { isLoading: authLoading, hasPermission } = useSession();

  const {
    organization,
    isLoading: orgLoading,
    updateOrganization,
  } = useOrganization();

  // Estados do formulário de organização
  const [name, setName] = useState<string | undefined>(undefined);
  const [slug, setSlug] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canManage = hasPermission("ORGANIZATION_MANAGE");

  // Redirect se sem permissão
  useEffect(() => {
    if (!authLoading && !canManage) {
      router.push("/");
    }
  }, [authLoading, canManage, router]);

  // Valores do formulário
  const nameValue = name ?? organization?.name ?? "";
  const slugValue = slug ?? organization?.slug ?? "";

  // Handler de submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setSuccess(false);
    setSaving(true);

    const result = await updateOrganization({
      name: nameValue,
      slug: slugValue,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

    setSaving(false);
  };

  const hasChanges =
    organization && (name !== organization.name || slug !== organization.slug);

  const isLoading = authLoading || orgLoading;

  if (isLoading || !canManage) {
    return null;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Organização</h1>
            <p className="text-muted-foreground">
              Gerencie as informações da sua organização
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
                  value={nameValue}
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
                  value={slugValue}
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
                <Button type="submit" disabled={saving || !hasChanges}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
