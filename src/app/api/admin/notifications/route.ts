import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureAdmin();
  } catch {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const messages = await prisma.contactMessage.findMany({
    where: { read: false, senderType: "customer" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      name: true,
      message: true,
      createdAt: true,
    },
  });

  const items = messages.map((m) => ({
    id: m.id,
    name: m.name,
    snippet:
      m.message.length > 80 ? `${m.message.slice(0, 77).trimEnd()}...` : m.message,
    createdAt: m.createdAt.toISOString(),
  }));

  return NextResponse.json({ items });
}
