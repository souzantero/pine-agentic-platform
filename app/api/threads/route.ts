import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Permission } from "@/lib/generated/prisma/client";
import { validatePermission, authError } from "@/lib/api-auth";

// GET - Listar threads da organizacao atual
export async function GET() {
  const auth = await validatePermission(Permission.THREADS_READ);
  if (!auth.success) {
    return authError(auth.error);
  }

  const { currentMembership } = auth.session;

  const threads = await prisma.thread.findMany({
    where: {
      organizationId: currentMembership.organizationId,
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json({ threads });
}

// POST - Criar nova thread
export async function POST(request: Request) {
  const auth = await validatePermission(Permission.THREADS_WRITE);
  if (!auth.success) {
    return authError(auth.error);
  }

  const { currentMembership } = auth.session;

  let title: string | undefined;
  try {
    const body = await request.json();
    title = body.title;
  } catch {
    // Body vazio e valido - thread sem titulo
  }

  const thread = await prisma.thread.create({
    data: {
      organizationId: currentMembership.organizationId,
      createdById: currentMembership.id,
      title: title || null,
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ thread }, { status: 201 });
}
