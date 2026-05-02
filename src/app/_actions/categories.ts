"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
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
  await prisma.category.create({
    data: { ...data, order: (last._max.order ?? -1) + 1 },
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
  revalidatePath("/admin/categories");
  revalidatePath("/projects");
}

export async function deleteCategory(id: string) {
  await ensureAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/projects");
}
