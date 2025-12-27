import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { Permission, RoleScope } from "@/lib/generated/prisma/client";
import { validateSession, authError } from "@/lib/api-auth";

const CURRENT_ORG_COOKIE = "current_org";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

// Permissões padrão para cada role de sistema
const SYSTEM_ROLES = {
  Owner: {
    description: "Dono da organização com acesso total",
    permissions: Object.values(Permission), // Todas as permissões
  },
  Admin: {
    description: "Administrador com permissões de gerenciamento",
    permissions: [
      Permission.THREADS_READ,
      Permission.THREADS_WRITE,
      Permission.THREADS_DELETE,
      Permission.AGENTS_READ,
      Permission.AGENTS_WRITE,
      Permission.AGENTS_DELETE,
      Permission.MEMBERS_READ,
      Permission.MEMBERS_INVITE,
      Permission.MEMBERS_MANAGE,
      Permission.ROLES_READ,
      Permission.ROLES_MANAGE,
    ],
  },
  Member: {
    description: "Membro com permissões básicas",
    permissions: [
      Permission.THREADS_READ,
      Permission.THREADS_WRITE,
      Permission.AGENTS_READ,
      Permission.MEMBERS_READ,
    ],
  },
};

// POST - Criar nova organização
export async function POST(request: NextRequest) {
  try {
    const auth = await validateSession();
    if (!auth.success) {
      return authError(auth.error);
    }

    const { user } = auth.session;
    const { name, slug } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Nome da organização é obrigatório" },
        { status: 400 }
      );
    }

    if (!slug?.trim()) {
      return NextResponse.json(
        { error: "Slug é obrigatório" },
        { status: 400 }
      );
    }

    // Validar formato do slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Slug deve conter apenas letras minúsculas, números e hífens" },
        { status: 400 }
      );
    }

    if (slug.length < 3 || slug.length > 50) {
      return NextResponse.json(
        { error: "Slug deve ter entre 3 e 50 caracteres" },
        { status: 400 }
      );
    }

    // Verificar se slug já existe
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Este slug já está em uso" },
        { status: 409 }
      );
    }

    // Criar organização com roles padrão e membership em transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar organização
      const organization = await tx.organization.create({
        data: {
          name: name.trim(),
          slug: slug.trim(),
        },
      });

      // 2. Criar roles de sistema
      const roles: Record<string, { id: string }> = {};

      for (const [roleName, roleConfig] of Object.entries(SYSTEM_ROLES)) {
        const role = await tx.role.create({
          data: {
            organizationId: organization.id,
            scope: RoleScope.ORGANIZATION,
            name: roleName,
            description: roleConfig.description,
            isSystemRole: true,
          },
        });

        // 3. Criar permissões para a role
        await tx.rolePermission.createMany({
          data: roleConfig.permissions.map((permission) => ({
            roleId: role.id,
            permission,
          })),
        });

        roles[roleName] = { id: role.id };
      }

      // 4. Criar membership do usuário como Owner
      const membership = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          roleId: roles.Owner.id,
          isOwner: true,
        },
        include: {
          organization: true,
          role: {
            include: {
              permissions: {
                select: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      return { organization, membership };
    });

    // Definir a nova org como ativa
    const cookieStore = await cookies();
    cookieStore.set(CURRENT_ORG_COOKIE, result.organization.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return NextResponse.json({
      organization: result.organization,
      membership: {
        id: result.membership.id,
        isOwner: result.membership.isOwner,
        organization: result.membership.organization,
        role: {
          id: result.membership.role.id,
          name: result.membership.role.name,
          description: result.membership.role.description,
          scope: result.membership.role.scope,
          isSystemRole: result.membership.role.isSystemRole,
          permissions: result.membership.role.permissions.map((p) => p.permission),
        },
      },
    });
  } catch (error) {
    console.error("Create organization error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// GET - Listar organizações do usuário
export async function GET() {
  const auth = await validateSession();
  if (!auth.success) {
    return authError(auth.error);
  }

  // Retorna as memberships já carregadas pelo validateSession
  return NextResponse.json({ memberships: auth.session.memberships });
}
