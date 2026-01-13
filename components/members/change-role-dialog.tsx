"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import type { Member, Role } from "@/lib/types";

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  roles: Role[];
  onChangeRole: (memberId: string, roleId: string) => Promise<{ error?: string }>;
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  member,
  roles,
  onChangeRole,
}: ChangeRoleDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar para não mostrar Owner nas opções
  const availableRoles = roles.filter((r) => r.name !== "Owner");

  // Reset quando o dialog abre com um novo membro
  useEffect(() => {
    if (member) {
      setSelectedRoleId(member.role.id);
      setError(null);
    }
  }, [member]);

  const handleSave = async () => {
    if (!member || !selectedRoleId) return;

    if (selectedRoleId === member.role.id) {
      onOpenChange(false);
      return;
    }

    setError(null);
    setLoading(true);

    const result = await onChangeRole(member.id, selectedRoleId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setError(null);
    onOpenChange(false);
  };

  if (!member) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-[90vw] md:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Alterar Função
          </AlertDialogTitle>
          <AlertDialogDescription>
            Altere a função de <strong>{member.user.name}</strong> na
            organização.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Nova função</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex flex-col">
                      <span>{role.name}</span>
                      {role.description && (
                        <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
