"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { ensureAdmin } from "@/lib/admin-guard";
import { logActivity } from "@/lib/activity";

const commentSchema = z.object({
  parentType: z.enum(["project", "gallery"]),
  parentId: z.string().min(1),
  body: z.string().min(1, "Say something").max(4000),
});

function pathFor(parentType: string, parentSlugOrId: string): string {
  if (parentType === "project") return `/projects/${parentSlugOrId}`;
  return `/gallery/${parentSlugOrId}`;
}

export async function addComment(formData: FormData) {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("Sign in to comment");

  const data = commentSchema.parse({
    parentType: formData.get("parentType"),
    parentId: formData.get("parentId"),
    body: formData.get("body"),
  });

  await prisma.comment.create({
    data: {
      customerId: customer.id,
      parentType: data.parentType,
      parentId: data.parentId,
      body: data.body.trim(),
    },
  });

  // The parentId here is the project slug or the gallery image id,
  // depending on the section — that's what the public URL uses.
  revalidatePath(pathFor(data.parentType, data.parentId));
}

export async function deleteOwnComment(commentId: string) {
  const customer = await getCurrentCustomer();
  if (!customer) throw new Error("Sign in first");
  const c = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!c) return;
  if (c.customerId !== customer.id) throw new Error("Not your comment");
  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(pathFor(c.parentType, c.parentId));
}

export async function adminDeleteComment(commentId: string) {
  await ensureAdmin();
  const c = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!c) return;
  await prisma.comment.delete({ where: { id: commentId } });
  await logActivity("comment.delete", {
    entityType: "comment",
    entityId: commentId,
    label: c.body.slice(0, 60),
  });
  revalidatePath(pathFor(c.parentType, c.parentId));
}
