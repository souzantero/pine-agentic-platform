import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Permission } from "@/lib/generated/prisma/client";
import { validatePermission, authError } from "@/lib/api-auth";

// DELETE - Remover provedor de modelos
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ providerId: string }> }
) {
  const auth = await validatePermission(Permission.ORGANIZATION_MANAGE);
  if (!auth.success) {
    return authError(auth.error);
  }

  const { currentMembership } = auth.session;
  const { providerId } = await params;

  // Verificar se o provedor pertence a organizacao
  const provider = await prisma.organizationModelProvider.findFirst({
    where: {
      id: providerId,
      organizationId: currentMembership.organizationId,
    },
  });

  if (!provider) {
    return NextResponse.json(
      { error: "Provedor não encontrado" },
      { status: 404 }
    );
  }

  // Se este provedor for o padrao, remover como padrao
  const organization = await prisma.organization.findUnique({
    where: { id: currentMembership.organizationId },
    select: { defaultModelProvider: true },
  });

  if (organization?.defaultModelProvider === provider.provider) {
    await prisma.organization.update({
      where: { id: currentMembership.organizationId },
      data: { defaultModelProvider: null },
    });
  }

  // Deletar o provedor
  await prisma.organizationModelProvider.delete({
    where: { id: providerId },
  });

  return NextResponse.json({ success: true });
}
