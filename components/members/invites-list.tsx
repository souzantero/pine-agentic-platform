"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Check, Clock, Shield } from "lucide-react";
import type { Invite } from "@/lib/types";

interface InvitesListProps {
  invites: Invite[];
}

export function InvitesList({ invites }: InvitesListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleCopy = async (invite: Invite) => {
    await navigator.clipboard.writeText(invite.inviteLink);
    setCopiedId(invite.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (invites.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Nenhum convite pendente
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[300px]">
      <div className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-muted rounded-md shrink-0">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{invite.role.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    Expira em {formatDate(invite.expiresAt)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 ml-2"
              onClick={() => handleCopy(invite)}
            >
              {copiedId === invite.id ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
