"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  MemberList,
  CreateInviteDialog,
  ChangeRoleDialog,
  RemoveMemberDialog,
  InvitesList,
  type Member,
  type Invite,
} from "@/components/members";
import { Users, Link as LinkIcon, ArrowLeft } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
}

export default function MembersPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading, hasOrganization, hasPermission, currentMembership } = useAuth();
  const orgId = currentMembership?.organizationId;

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);

  // Dialog states
  const [createInviteOpen, setCreateInviteOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const canInvite = hasPermission("MEMBERS_INVITE");
  const canManage = hasPermission("MEMBERS_MANAGE");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        router.push("/login");
      } else if (!hasOrganization) {
        router.push("/onboarding");
      }
    }
  }, [isLoading, isLoggedIn, hasOrganization, router]);

  // Load members
  const loadMembers = useCallback(async () => {
    if (!orgId) return;

    try {
      const response = await api.get<Member[]>(
        `/organizations/${orgId}/members`
      );
      if (response.error || !response.data) return;

      setMembers(response.data);
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoadingMembers(false);
    }
  }, [orgId]);

  // Load invites
  const loadInvites = useCallback(async () => {
    if (!canInvite || !orgId) {
      setLoadingInvites(false);
      return;
    }

    try {
      const response = await api.get<Invite[]>(
        `/organizations/${orgId}/invites`
      );
      if (response.error || !response.data) return;

      setInvites(response.data);
    } catch (error) {
      console.error("Failed to load invites:", error);
    } finally {
      setLoadingInvites(false);
    }
  }, [canInvite, orgId]);

  // Load roles
  const loadRoles = useCallback(async () => {
    if (!orgId) return;

    try {
      const response = await api.get<Role[]>(
        `/organizations/${orgId}/roles`
      );
      if (response.error || !response.data) return;

      setRoles(response.data);
    } catch (error) {
      console.error("Failed to load roles:", error);
    }
  }, [orgId]);

  useEffect(() => {
    if (isLoggedIn && hasOrganization) {
      loadMembers();
      loadInvites();
      loadRoles();
    }
  }, [isLoggedIn, hasOrganization, loadMembers, loadInvites, loadRoles]);

  // Handlers
  const handleCreateInvite = async (
    roleId: string
  ): Promise<{ inviteLink?: string; error?: string }> => {
    if (!orgId) return { error: "Organização não selecionada" };

    try {
      const response = await api.post<{ inviteLink: string }>(
        `/organizations/${orgId}/invites`,
        { roleId }
      );

      if (response.error) {
        return { error: response.error };
      }

      // Reload invites
      loadInvites();

      return { inviteLink: response.data?.inviteLink };
    } catch {
      return { error: "Erro ao criar convite" };
    }
  };

  const handleChangeRole = async (
    memberId: string,
    roleId: string
  ): Promise<{ error?: string }> => {
    if (!orgId) return { error: "Organização não selecionada" };

    try {
      const response = await api.put(
        `/organizations/${orgId}/members/${memberId}/role`,
        { roleId }
      );

      if (response.error) {
        return { error: response.error };
      }

      // Reload members
      loadMembers();

      return {};
    } catch {
      return { error: "Erro ao alterar função" };
    }
  };

  const handleRemove = async (memberId: string): Promise<{ error?: string }> => {
    if (!orgId) return { error: "Organização não selecionada" };

    try {
      const response = await api.delete(
        `/organizations/${orgId}/members/${memberId}`
      );

      if (response.error) {
        return { error: response.error };
      }

      // Reload members
      loadMembers();

      return {};
    } catch {
      return { error: "Erro ao remover membro" };
    }
  };

  const openChangeRole = (member: Member) => {
    setSelectedMember(member);
    setChangeRoleOpen(true);
  };

  const openRemove = (member: Member) => {
    setSelectedMember(member);
    setRemoveOpen(true);
  };

  if (isLoading || !isLoggedIn || !hasOrganization) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex-1 overflow-auto">
        <div className="container max-w-4xl mx-auto py-6 px-4">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Membros</h1>
                <p className="text-muted-foreground">
                  Gerencie os membros da sua organização
                </p>
              </div>
            </div>

            {canInvite && (
              <Button onClick={() => setCreateInviteOpen(true)}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Criar Convite
              </Button>
            )}
          </div>

          {/* Members Card */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Membros ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMembers ? (
                <div className="flex justify-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                <MemberList
                  members={members}
                  currentUserId={user?.id || ""}
                  canManage={canManage}
                  onChangeRole={openChangeRole}
                  onRemove={openRemove}
                />
              )}
            </CardContent>
          </Card>

          {/* Invites Card */}
          {canInvite && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  Convites Pendentes ({invites.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInvites ? (
                  <div className="flex justify-center py-8 text-muted-foreground">
                    Carregando...
                  </div>
                ) : (
                  <InvitesList invites={invites} />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateInviteDialog
        open={createInviteOpen}
        onOpenChange={setCreateInviteOpen}
        roles={roles}
        onCreateInvite={handleCreateInvite}
      />

      <ChangeRoleDialog
        open={changeRoleOpen}
        onOpenChange={setChangeRoleOpen}
        member={selectedMember}
        roles={roles}
        onChangeRole={handleChangeRole}
      />

      <RemoveMemberDialog
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        member={selectedMember}
        onRemove={handleRemove}
      />
    </div>
  );
}
