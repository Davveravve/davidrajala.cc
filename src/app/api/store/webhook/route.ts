import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripeClient, getStripeSettings } from "@/lib/stripe-config";
import { logActivity } from "@/lib/activity";

// Stripe needs the raw request body to verify signatures, so we never
// JSON-parse it before passing to constructEvent.
export async function POST(req: Request) {
  const stripe = await getStripeClient();
  const cfg = await getStripeSettings();
  if (!stripe || !cfg || !cfg.webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503 },
    );
  }

  const sig = (await headers()).get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, cfg.webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Bad signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.client_reference_id ?? session.metadata?.orderId;
        if (!orderId) break;
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "paid",
            paidAt: new Date(),
            stripePaymentIntent:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : (session.payment_intent?.id ?? null),
          },
        });
        await logActivity("order.paid", {
          entityType: "order",
          entityId: orderId,
          label: `${session.amount_total ?? 0} ${session.currency ?? ""}`.trim(),
        });
        break;
      }
      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.client_reference_id ?? session.metadata?.orderId;
        if (!orderId) break;
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "failed" },
        });
        break;
      }
      // Other events are ignored — we can extend later.
    }
  } catch (err) {
    console.error("[stripe webhook] handler failed:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
