import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ items: [] }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { customerId: customer.id, notifyCustomer: true },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      items: {
        take: 1,
        include: {
          product: { select: { title: true } },
        },
      },
    },
  });

  const items = orders.map((order) => ({
    id: order.id,
    title: order.items[0]?.product?.title ?? "Gift order",
    note: order.giftNote ?? "",
    createdAt: order.createdAt.toISOString(),
  }));

  return NextResponse.json({ items });
}
