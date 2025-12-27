import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");

    if (!session?.value) {
      return NextResponse.json({ user: null, memberships: [] });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.value },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        memberships: {
          select: {
            id: true,
            isOwner: true,
            createdAt: true,
            organizationId: true,
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                createdAt: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                scope: true,
                isSystemRole: true,
                permissions: {
                  select: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      cookieStore.delete("session");
      return NextResponse.json({ user: null, memberships: [] });
    }

    const { memberships, ...userData } = user;

    // Formatar memberships para incluir permissões como array simples
    const formattedMemberships = memberships.map((m) => ({
      id: m.id,
      isOwner: m.isOwner,
      createdAt: m.createdAt,
      organizationId: m.organizationId,
      organization: m.organization,
      role: {
        id: m.role.id,
        name: m.role.name,
        description: m.role.description,
        scope: m.role.scope,
        isSystemRole: m.role.isSystemRole,
        permissions: m.role.permissions.map((p) => p.permission),
      },
    }));

    return NextResponse.json({
      user: userData,
      memberships: formattedMemberships,
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null, memberships: [] });
  }
}
