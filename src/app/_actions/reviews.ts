"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { ensureAdmin } from "@/lib/admin-guard";
import { logActivity } from "@/lib/activity";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).default(""),
  body: z.string().max(4000).default(""),
});

/// Submit (or replace) a review for a store product. Requires:
///   1. Signed-in customer
///   2. At least one PAID OrderItem for this product owned by them
/// Falls back to silent insert when the unique constraint exists, so a
/// double-submit just updates the existing row.
export async function submitReview(formData: FormData) {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("Sign in to write a review");

  const data = reviewSchema.parse({
    productId: formData.get("productId"),
    rating: formData.get("rating"),
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
  });

  const owned = await prisma.orderItem.findFirst({
    where: {
      productId: data.productId,
      order: { customerId: customer.id, status: "paid" },
    },
    select: { id: true },
  });
  if (!owned) {
    throw new Error("Only customers who bought this product can review it");
  }

  const product = await prisma.storeProduct.findUnique({
    where: { id: data.productId },
    select: { slug: true, title: true },
  });
  if (!product) throw new Error("Product not found");

  const existing = await prisma.review.findUnique({
    where: {
      customerId_productId: {
        customerId: customer.id,
        productId: data.productId,
      },
    },
  });

  if (existing) {
    await prisma.review.update({
      where: { id: existing.id },
      data: {
        rating: data.rating,
        title: data.title,
        body: data.body,
      },
    });
  } else {
    await prisma.review.create({
      data: {
        customerId: customer.id,
        productId: data.productId,
        rating: data.rating,
        title: data.title,
        body: data.body,
      },
    });
  }

  revalidatePath(`/store/${product.slug}`);
}

export async function deleteOwnReview(reviewId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("Sign in first");
  const r = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: { select: { slug: true } } },
  });
  if (!r) return;
  if (r.customerId !== customer.id) throw new Error("Not your review");
  await prisma.review.delete({ where: { id: reviewId } });
  revalidatePath(`/store/${r.product.slug}`);
}

/// Admin-only: nuke any review (e.g. spam, abuse). Logs to activity.
export async function adminDeleteReview(reviewId: string) {
  await ensureAdmin();
  const r = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: { select: { slug: true, title: true } } },
  });
  if (!r) return;
  await prisma.review.delete({ where: { id: reviewId } });
  await logActivity("review.delete", {
    entityType: "review",
    entityId: reviewId,
    label: `${r.product?.title ?? ""} (${r.rating}★)`,
  });
  revalidatePath(`/store/${r.product?.slug}`);
}
