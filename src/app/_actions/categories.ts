"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { logActivity } from "@/lib/activity";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(60),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "Endast a-z, 0-9 och bindestreck"),
});

export async function createCategory(formData: FormData) {
  await ensureAdmin();
  const data = schema.parse({
    name: formData.get("name"),
    slug: String(formData.get("slug") ?? "")
      .toLowerCase()
      .trim(),
  });
  const last = await prisma.category.aggregate({ _max: { order: true } });
  const created = await prisma.category.create({
    data: { ...data, order: (last._max.order ?? -1) + 1 },
  });
  await logActivity("category.create", {
    entityType: "category",
    entityId: created.id,
    label: data.name,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/projects");
}

export async function updateCategory(id: string, formData: FormData) {
  await ensureAdmin();
  const data = schema.parse({
    name: formData.get("name"),
    slug: String(formData.get("slug") ?? "")
      .toLowerCase()
      .trim(),
  });
  await prisma.category.update({ where: { id }, data });
  await logActivity("category.update", {
    entityType: "category",
    entityId: id,
    label: data.name,
  });
  revalidatePath("/admin/categories");
  revalidatePath("/projects");
}

export async function deleteCategory(id: string) {
  await ensureAdmin();
  const existing = await prisma.category.findUnique({ where: { id } });
  await prisma.category.delete({ where: { id } });
  await logActivity("category.delete", {
    entityType: "category",
    entityId: id,
    label: existing?.name ?? "",
  });
  revalidatePath("/admin/categories");
  revalidatePath("/projects");
}
