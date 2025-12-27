import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession, authError } from "@/lib/api-auth";

const CURRENT_ORG_COOKIE = "current_org";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 ano

// GET - Obter org ativa atual
export async function GET() {
  const auth = await validateSession();
  if (!auth.success) {
    return authError(auth.error);
  }

  const cookieStore = await cookies();
  const currentOrgId = cookieStore.get(CURRENT_ORG_COOKIE)?.value;

  // Verificar se a org ativa ainda é válida (usuário ainda é membro)
  const membership = auth.session.memberships.find(
    (m) => m.organizationId === currentOrgId
  );

  if (membership) {
    return NextResponse.json({ currentOrganization: membership });
  }

  // Se não encontrou ou não é mais membro, usar a primeira org
  const firstMembership = auth.session.memberships[0];
  if (firstMembership) {
    // Atualizar cookie para a primeira org
    cookieStore.set(CURRENT_ORG_COOKIE, firstMembership.organizationId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return NextResponse.json({ currentOrganization: firstMembership });
  }

  return NextResponse.json({ currentOrganization: null });
}

// PUT - Trocar org ativa
export async function PUT(request: NextRequest) {
  const auth = await validateSession();
  if (!auth.success) {
    return authError(auth.error);
  }

  const { organizationId } = await request.json();

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId é obrigatório" },
      { status: 400 }
    );
  }

  // Verificar se o usuário é membro desta org
  const membership = auth.session.memberships.find(
    (m) => m.organizationId === organizationId
  );

  if (!membership) {
    return NextResponse.json(
      { error: "Você não é membro desta organização" },
      { status: 403 }
    );
  }

  // Definir cookie com a org ativa
  const cookieStore = await cookies();
  cookieStore.set(CURRENT_ORG_COOKIE, organizationId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return NextResponse.json({ currentOrganization: membership });
}
