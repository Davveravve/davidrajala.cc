"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { getStripeClient } from "@/lib/stripe-config";
import { logActivity } from "@/lib/activity";

const ALLOWED_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
type OrderStatus = (typeof ALLOWED_STATUSES)[number];

export async function setOrderStatus(orderId: string, status: string) {
  await ensureAdmin();
  if (!ALLOWED_STATUSES.includes(status as OrderStatus)) {
    throw new Error("Invalid status");
  }
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      paidAt: status === "paid" ? new Date() : null,
    },
  });
  await logActivity("order.statusChange", {
    entityType: "order",
    entityId: orderId,
    label: status,
  });
  revalidatePath("/admin/store/orders");
  revalidatePath(`/admin/store/orders/${orderId}`);
  revalidatePath("/store/account");
}

/// Pulls the latest state of the Stripe Checkout Session for this order
/// and updates the local row. Useful when the webhook didn't deliver
/// (e.g. wrong endpoint, network blip) but the customer actually paid.
export async function syncOrderFromStripe(orderId: string) {
  await ensureAdmin();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (!order.stripeSessionId) {
    throw new Error("This order has no Stripe session attached");
  }
  const stripe = await getStripeClient();
  if (!stripe) throw new Error("Stripe not configured");

  const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

  // Map Stripe payment_status → our status enum.
  let nextStatus: OrderStatus = "pending";
  if (session.payment_status === "paid") nextStatus = "paid";
  else if (session.payment_status === "no_payment_required" && session.status === "complete") {
    nextStatus = "paid";
  } else if (session.status === "expired") nextStatus = "failed";

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      paidAt: nextStatus === "paid" ? (order.paidAt ?? new Date()) : null,
      stripePaymentIntent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? order.stripePaymentIntent),
    },
  });

  await logActivity("order.sync", {
    entityType: "order",
    entityId: orderId,
    label: `synced → ${nextStatus}`,
  });

  revalidatePath("/admin/store/orders");
  revalidatePath(`/admin/store/orders/${orderId}`);
  revalidatePath("/store/account");
  return nextStatus;
}

const giftSchema = z.object({
  customerId: z.string().min(1),
  productId: z.string().min(1),
  noteToCustomer: z.string().max(500).default(""),
});

/// Creates a fully-paid Order on a customer's behalf — used for giveaways,
/// support comps, or when the owner wants to manually grant access. The
/// customer sees a notification and the gift note on their /store/account.
export async function giftOrderToCustomer(formData: FormData) {
  await ensureAdmin();
  const data = giftSchema.parse({
    customerId: formData.get("customerId"),
    productId: formData.get("productId"),
    noteToCustomer: formData.get("noteToCustomer") ?? "",
  });

  const [customer, product] = await Promise.all([
    prisma.customer.findUnique({ where: { id: data.customerId } }),
    prisma.storeProduct.findUnique({ where: { id: data.productId } }),
  ]);
  if (!customer) throw new Error("Customer not found");
  if (!product) throw new Error("Product not found");

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      totalAmount: 0,
      currency: product.currency,
      status: "paid",
      isGift: true,
      giftNote: data.noteToCustomer,
      notifyCustomer: true,
      paidAt: new Date(),
      items: {
        create: {
          productId: product.id,
          priceAtPurchase: 0,
          fileUrlSnapshot: product.fileUrl,
          fileNameSnapshot: product.fileName,
        },
      },
    },
  });

  await logActivity("order.gift", {
    entityType: "order",
    entityId: order.id,
    label: `${product.title} → ${customer.email}${data.noteToCustomer ? ` (${data.noteToCustomer})` : ""}`,
  });

  revalidatePath("/admin/store/orders");
  revalidatePath("/admin/store/customers");
  revalidatePath(`/admin/store/customers/${customer.id}`);
  revalidatePath("/store/account");
  redirect(`/admin/store/orders/${order.id}`);
}

/// Clears the customer-side notification flag — called when the customer
/// opens the order detail page so the toast doesn't keep appearing.
export async function dismissOrderNotice(orderId: string, customerId: string) {
  // Self-call from customer-facing pages — no admin guard, but we verify
  // ownership.
  await prisma.order.updateMany({
    where: { id: orderId, customerId },
    data: { notifyCustomer: false },
  });
}
