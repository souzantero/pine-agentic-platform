"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Shield, Crown, UserMinus } from "lucide-react";
import type { Member } from "@/lib/types";

interface MemberListProps {
  members: Member[];
  currentUserId: string;
  canManage: boolean;
  onChangeRole: (member: Member) => void;
  onRemove: (member: Member) => void;
}

export function MemberList({
  members,
  currentUserId,
  canManage,
  onChangeRole,
  onRemove,
}: MemberListProps) {
  const getInitials = (name: string, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        Nenhum membro encontrado
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-280px)]">
      {/* Desktop view - Table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-muted-foreground">
              <th className="pb-3 font-medium">Membro</th>
              <th className="pb-3 font-medium">Função</th>
              <th className="pb-3 font-medium">Entrou em</th>
              {canManage && <th className="pb-3 font-medium w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm">
                        {getInitials(member.user.name, member.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.user.name}</span>
                        {member.isOwner && (
                          <Crown className="h-4 w-4 text-amber-500" />
                        )}
                        {member.user.id === currentUserId && (
                          <span className="text-xs text-muted-foreground">
                            (você)
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {member.user.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm">
                    <Shield className="h-3.5 w-3.5" />
                    {member.role.name}
                  </span>
                </td>
                <td className="py-3 text-sm text-muted-foreground">
                  {formatDate(member.createdAt)}
                </td>
                {canManage && (
                  <td className="py-3">
                    {!member.isOwner && member.user.id !== currentUserId && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onChangeRole(member)}>
                            <Shield className="mr-2 h-4 w-4" />
                            Alterar função
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onRemove(member)}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view - Cards */}
      <div className="md:hidden space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {getInitials(member.user.name, member.user.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.user.name}</span>
                  {member.isOwner && (
                    <Crown className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{member.role.name}</span>
                  {member.user.id === currentUserId && <span>(você)</span>}
                </div>
              </div>
            </div>
            {canManage &&
              !member.isOwner &&
              member.user.id !== currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onChangeRole(member)}>
                      <Shield className="mr-2 h-4 w-4" />
                      Alterar função
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onRemove(member)}
                      className="text-destructive focus:text-destructive"
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
