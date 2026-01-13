"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Member } from "@/lib/types";

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
  onRemove: (memberId: string) => Promise<{ error?: string }>;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  member,
  onRemove,
}: RemoveMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    if (!member) return;

    setError(null);
    setLoading(true);

    const result = await onRemove(member.id);

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
          <AlertDialogTitle>Remover Membro</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover <strong>{member.user.name}</strong>{" "}
            da organização? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Removendo..." : "Remover"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
