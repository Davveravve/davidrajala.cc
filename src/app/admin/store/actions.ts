"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { saveUploadedFile, deleteUpload, isLocalUpload } from "@/lib/uploads";
import { logActivity } from "@/lib/activity";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base || "product";
  let n = 0;
  while (true) {
    const existing = await prisma.storeProduct.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    n++;
    candidate = `${base}-${n}`;
  }
}

const productSchema = z.object({
  title: z.string().min(1).max(120),
  slug: z.string().max(100).optional(),
  summary: z.string().max(400).default(""),
  description: z.string().max(20000).default(""),
  category: z.enum(["game", "asset", "program", "other"]).default("other"),
  price: z.coerce.number().int().min(0).max(999_999_99).default(0),
  currency: z.string().min(3).max(3).default("SEK"),
  externalUrl: z.string().url().optional().or(z.literal("")),
  published: z.boolean().default(true),
  featured: z.boolean().default(false),
});

function fdToBool(v: FormDataEntryValue | null) {
  return v === "on" || v === "true" || v === "1";
}

export async function createStoreProduct(formData: FormData) {
  await ensureAdmin();
  const data = productSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    summary: formData.get("summary") ?? "",
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "other",
    price: formData.get("price") ?? 0,
    currency: formData.get("currency") ?? "SEK",
    externalUrl: formData.get("externalUrl") ?? "",
    published: fdToBool(formData.get("published")),
    featured: fdToBool(formData.get("featured")),
  });

  const slugBase = slugify(data.slug || data.title);
  const slug = await uniqueSlug(slugBase);

  const cover = formData.get("coverFile") as File | null;
  let coverUrl = String(formData.get("coverUrl") ?? "").trim();
  if (cover && cover.size > 0) {
    coverUrl = await saveUploadedFile(cover, "covers");
  }

  const file = formData.get("productFile") as File | null;
  let fileUrl = "";
  let fileName = "";
  let fileSize = 0;
  if (file && file.size > 0) {
    fileUrl = await saveUploadedFile(file, "store");
    fileName = file.name;
    fileSize = file.size;
  }

  const last = await prisma.storeProduct.aggregate({ _max: { order: true } });
  const order = (last._max.order ?? -1) + 1;

  const product = await prisma.storeProduct.create({
    data: {
      title: data.title,
      slug,
      summary: data.summary,
      description: data.description,
      category: data.category,
      price: data.price,
      currency: data.currency.toUpperCase(),
      externalUrl: data.externalUrl || null,
      published: data.published,
      featured: data.featured,
      coverUrl,
      fileUrl,
      fileName,
      fileSize,
      order,
    },
  });

  await logActivity("store.create", {
    entityType: "product",
    entityId: product.id,
    label: data.title,
  });

  revalidatePath("/store");
  revalidatePath("/admin/store");
  redirect(`/admin/store/${product.id}`);
}

export async function updateStoreProduct(id: string, formData: FormData) {
  await ensureAdmin();
  const data = productSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug") || undefined,
    summary: formData.get("summary") ?? "",
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "other",
    price: formData.get("price") ?? 0,
    currency: formData.get("currency") ?? "SEK",
    externalUrl: formData.get("externalUrl") ?? "",
    published: fdToBool(formData.get("published")),
    featured: fdToBool(formData.get("featured")),
  });

  const existing = await prisma.storeProduct.findUnique({ where: { id } });
  if (!existing) throw new Error("Product not found");

  const slugBase = slugify(data.slug || data.title);
  const slug = await uniqueSlug(slugBase, id);

  let coverUrl = existing.coverUrl;
  const cover = formData.get("coverFile") as File | null;
  const coverUrlInput = String(formData.get("coverUrl") ?? "").trim();
  if (cover && cover.size > 0) {
    coverUrl = await saveUploadedFile(cover, "covers");
    if (existing.coverUrl && isLocalUpload(existing.coverUrl)) {
      await deleteUpload(existing.coverUrl);
    }
  } else if (coverUrlInput && coverUrlInput !== existing.coverUrl) {
    coverUrl = coverUrlInput;
  }

  let fileUrl = existing.fileUrl;
  let fileName = existing.fileName;
  let fileSize = existing.fileSize;
  const file = formData.get("productFile") as File | null;
  if (file && file.size > 0) {
    fileUrl = await saveUploadedFile(file, "store");
    fileName = file.name;
    fileSize = file.size;
    if (existing.fileUrl && isLocalUpload(existing.fileUrl)) {
      await deleteUpload(existing.fileUrl);
    }
  }

  await prisma.storeProduct.update({
    where: { id },
    data: {
      title: data.title,
      slug,
      summary: data.summary,
      description: data.description,
      category: data.category,
      price: data.price,
      currency: data.currency.toUpperCase(),
      externalUrl: data.externalUrl || null,
      published: data.published,
      featured: data.featured,
      coverUrl,
      fileUrl,
      fileName,
      fileSize,
    },
  });

  await logActivity("store.update", {
    entityType: "product",
    entityId: id,
    label: data.title,
  });

  revalidatePath("/store");
  revalidatePath(`/store/${slug}`);
  revalidatePath("/admin/store");
}

export async function deleteStoreProduct(id: string) {
  await ensureAdmin();
  const existing = await prisma.storeProduct.findUnique({ where: { id } });
  if (!existing) return;

  if (existing.coverUrl && isLocalUpload(existing.coverUrl)) {
    await deleteUpload(existing.coverUrl);
  }
  if (existing.fileUrl && isLocalUpload(existing.fileUrl)) {
    await deleteUpload(existing.fileUrl);
  }

  await prisma.storeProduct.delete({ where: { id } });

  await logActivity("store.delete", {
    entityType: "product",
    entityId: id,
    label: existing.title,
  });

  revalidatePath("/store");
  revalidatePath("/admin/store");
}
