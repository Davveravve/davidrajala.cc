"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { signDownloadToken } from "@/lib/download-tokens";

/// Verify the signed-in customer owns this OrderItem (paid order, matching
/// customerId), then mint a signed download URL for it. Throws on mismatch.
export async function mintDownload(orderItemId: string): Promise<string> {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("Not signed in");

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: { select: { customerId: true, status: true } } },
  });

  if (!item) throw new Error("Order item not found");
  if (item.order.customerId !== customer.id) throw new Error("Not yours");
  if (item.order.status !== "paid") throw new Error("Order not paid");

  const token = await signDownloadToken(item.id, customer.id);
  return `/api/store/download/${token}`;
}
