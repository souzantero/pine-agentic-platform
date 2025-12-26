import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("session");

    if (!session?.value) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.value },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      cookieStore.delete("session");
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null });
  }
}
