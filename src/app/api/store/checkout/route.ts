import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getStripeClient, getStripeSettings } from "@/lib/stripe-config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://davidrajala.cc";

export async function POST(req: Request) {
  // Rate-limit by IP — even logged-in customers shouldn't hammer this.
  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRate(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json(
      { error: "Sign in to buy.", redirect: "/store/login" },
      { status: 401 },
    );
  }

  let body: { productId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const productId = String(body.productId ?? "");
  if (!productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }

  const product = await prisma.storeProduct.findUnique({ where: { id: productId } });
  if (!product || !product.published) {
    return NextResponse.json({ error: "Product unavailable" }, { status: 404 });
  }
  if (product.price <= 0) {
    return NextResponse.json({ error: "Product price not set" }, { status: 400 });
  }
  if (product.externalUrl) {
    return NextResponse.json(
      { error: "This product is sold externally" },
      { status: 400 },
    );
  }

  const stripe = await getStripeClient();
  const cfg = await getStripeSettings();
  if (!stripe || !cfg) {
    return NextResponse.json(
      { error: "Checkout not configured yet — try again later." },
      { status: 503 },
    );
  }

  // Create a pending Order up front so we can attribute the Stripe session.
  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      totalAmount: product.price,
      currency: product.currency,
      status: "pending",
      items: {
        create: {
          productId: product.id,
          priceAtPurchase: product.price,
          fileUrlSnapshot: product.fileUrl,
          fileNameSnapshot: product.fileName,
        },
      },
    },
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customer.email,
      success_url: `${SITE_URL}${cfg.successPath}?order=${order.id}&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}${cfg.cancelPath}`,
      client_reference_id: order.id,
      metadata: {
        orderId: order.id,
        customerId: customer.id,
        productId: product.id,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: product.currency.toLowerCase(),
            unit_amount: product.price,
            product_data: {
              name: product.title,
              description: product.summary || undefined,
              images: product.coverUrl
                ? [new URL(product.coverUrl, SITE_URL).toString()]
                : undefined,
            },
          },
        },
      ],
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Roll the pending order back so it doesn't pollute /admin/orders.
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    const message =
      err instanceof Error ? err.message : "Stripe rejected the request";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// In-memory rate limiter — 10 checkout attempts per IP per 5 minutes.
const RATE_WINDOW_MS = 5 * 60_000;
const RATE_MAX = 10;
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (buckets.size > 5000) {
      // Trim oldest 1000 entries to bound memory
      const sorted = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
      sorted.slice(0, 1000).forEach(([k]) => buckets.delete(k));
    }
    return true;
  }
  if (bucket.count >= RATE_MAX) return false;
  bucket.count++;
  return true;
}
