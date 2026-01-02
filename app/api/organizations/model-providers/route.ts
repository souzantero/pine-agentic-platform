import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Permission, ModelProvider } from "@/lib/generated/prisma/client";
import { validatePermission, authError } from "@/lib/api-auth";

// GET - Listar provedores de modelos da organizacao
export async function GET() {
  const auth = await validatePermission(Permission.ORGANIZATION_MANAGE);
  if (!auth.success) {
    return authError(auth.error);
  }

  const { currentMembership } = auth.session;

  const organization = await prisma.organization.findUnique({
    where: { id: currentMembership.organizationId },
    select: {
      defaultModelProvider: true,
      modelProviders: {
        select: {
          id: true,
          provider: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { provider: "asc" },
      },
    },
  });

  if (!organization) {
    return NextResponse.json(
      { error: "Organização não encontrada" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    defaultProvider: organization.defaultModelProvider,
    providers: organization.modelProviders,
  });
}

// POST - Adicionar ou atualizar provedor de modelos
export async function POST(request: NextRequest) {
  const auth = await validatePermission(Permission.ORGANIZATION_MANAGE);
  if (!auth.success) {
    return authError(auth.error);
  }

  const { currentMembership } = auth.session;

  let body: { provider?: ModelProvider; apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { provider, apiKey } = body;

  if (!provider) {
    return NextResponse.json(
      { error: "Provedor é obrigatório" },
      { status: 400 }
    );
  }

  const validProviders: ModelProvider[] = ["OPENAI", "OPENROUTER", "ANTHROPIC", "GOOGLE"];
  if (!validProviders.includes(provider)) {
    return NextResponse.json(
      { error: "Provedor inválido" },
      { status: 400 }
    );
  }

  if (!apiKey || !apiKey.trim()) {
    return NextResponse.json(
      { error: "API Key é obrigatória" },
      { status: 400 }
    );
  }

  // Upsert do provedor
  const modelProvider = await prisma.organizationModelProvider.upsert({
    where: {
      organizationId_provider: {
        organizationId: currentMembership.organizationId,
        provider,
      },
    },
    update: {
      apiKey: apiKey.trim(),
      isActive: true,
    },
    create: {
      organizationId: currentMembership.organizationId,
      provider,
      apiKey: apiKey.trim(),
    },
    select: {
      id: true,
      provider: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ provider: modelProvider }, { status: 201 });
}

// PUT - Definir provedor padrao
export async function PUT(request: NextRequest) {
  const auth = await validatePermission(Permission.ORGANIZATION_MANAGE);
  if (!auth.success) {
    return authError(auth.error);
  }

  const { currentMembership } = auth.session;

  let body: { defaultProvider?: ModelProvider | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { defaultProvider } = body;

  // Se for definir um provedor padrao, verificar se ele existe e esta ativo
  if (defaultProvider) {
    const validProviders: ModelProvider[] = ["OPENAI", "OPENROUTER", "ANTHROPIC", "GOOGLE"];
    if (!validProviders.includes(defaultProvider)) {
      return NextResponse.json(
        { error: "Provedor inválido" },
        { status: 400 }
      );
    }

    const existingProvider = await prisma.organizationModelProvider.findUnique({
      where: {
        organizationId_provider: {
          organizationId: currentMembership.organizationId,
          provider: defaultProvider,
        },
      },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: "Configure a API Key do provedor antes de defini-lo como padrão" },
        { status: 400 }
      );
    }
  }

  await prisma.organization.update({
    where: { id: currentMembership.organizationId },
    data: { defaultModelProvider: defaultProvider },
  });

  return NextResponse.json({ defaultProvider });
}
