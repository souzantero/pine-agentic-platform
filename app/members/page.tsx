"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useMembers, useInvites, useRoles } from "@/lib/hooks";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MemberList,
  CreateInviteDialog,
  ChangeRoleDialog,
  RemoveMemberDialog,
  InvitesList,
  type Member,
} from "@/components/members";
import { Users, Link as LinkIcon, ArrowLeft } from "lucide-react";

export default function MembersPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading, hasOrganization, hasPermission } = useAuth();

  // Hooks
  const {
    members,
    isLoading: membersLoading,
    changeRole,
    removeMember,
  } = useMembers();

  const {
    invites,
    isLoading: invitesLoading,
    createInvite,
  } = useInvites();

  const { roles } = useRoles();

  // Dialog states
  const [createInviteOpen, setCreateInviteOpen] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const canInvite = hasPermission("MEMBERS_INVITE");
  const canManage = hasPermission("MEMBERS_MANAGE");

  // Redirect se não autenticado
  useEffect(() => {
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push("/login");
      } else if (!hasOrganization) {
        router.push("/onboarding");
      }
    }
  }, [authLoading, isLoggedIn, hasOrganization, router]);

  // Handlers
  const handleCreateInvite = async (
    roleId: string
  ): Promise<{ inviteLink?: string; error?: string }> => {
    return await createInvite(roleId);
  };

  const handleChangeRole = async (
    memberId: string,
    roleId: string
  ): Promise<{ error?: string }> => {
    return await changeRole(memberId, roleId);
  };

  const handleRemove = async (memberId: string): Promise<{ error?: string }> => {
    return await removeMember(memberId);
  };

  const openChangeRole = (member: Member) => {
    setSelectedMember(member);
    setChangeRoleOpen(true);
  };

  const openRemove = (member: Member) => {
    setSelectedMember(member);
    setRemoveOpen(true);
  };

  const isLoading = authLoading || membersLoading;

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
              {membersLoading ? (
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
                {invitesLoading ? (
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
