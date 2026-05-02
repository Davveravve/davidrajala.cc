"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { logActivity } from "@/lib/activity";
import { ADMIN_SENDER } from "@/lib/chat-thread";

export async function markMessageRead(id: string, read: boolean) {
  await ensureAdmin();
  await prisma.contactMessage.update({ where: { id }, data: { read } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function setMessageSaved(id: string, saved: boolean) {
  await ensureAdmin();
  await prisma.contactMessage.update({ where: { id }, data: { saved } });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessage(id: string) {
  await ensureAdmin();
  await prisma.contactMessage.delete({ where: { id } });
  await logActivity("message.delete", {
    entityType: "message",
    entityId: id,
    label: id.slice(0, 8),
  });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function markMessagesRead(ids: string[], read: boolean) {
  await ensureAdmin();
  if (ids.length === 0) return;
  await prisma.contactMessage.updateMany({
    where: { id: { in: ids } },
    data: { read },
  });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessages(ids: string[]) {
  await ensureAdmin();
  if (ids.length === 0) return;
  await prisma.contactMessage.deleteMany({ where: { id: { in: ids } } });
  await logActivity("message.bulkDelete", {
    entityType: "message",
    label: `${ids.length} messages`,
  });
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

/**
 * Admin-side reply into an existing thread. Looks up an existing customer
 * message in the same thread to copy the visitor's name + email into the
 * reply row, so the reply joins the same threadKey grouping query.
 */
export async function replyToThread(
  threadKey: string,
  message: string,
): Promise<{ ok: true; id: string; createdAt: string } | { ok: false; error: string }> {
  await ensureAdmin();
  const text = message.trim();
  if (!text) {
    return { ok: false, error: "Message is empty" };
  }
  if (text.length > 5000) {
    return { ok: false, error: "Message is too long" };
  }
  if (!threadKey || !threadKey.trim()) {
    return { ok: false, error: "No conversation" };
  }

  const original = await prisma.contactMessage.findFirst({
    where: { threadKey },
    orderBy: { createdAt: "asc" },
  });
  if (!original) {
    throw new Error("No conversation");
  }

  const created = await prisma.contactMessage.create({
    data: {
      name: original.name,
      email: original.email,
      message: text,
      senderType: ADMIN_SENDER,
      threadKey,
      read: true,
    },
  });

  await logActivity("chat.reply", {
    entityType: "message",
    entityId: created.id,
    label: text.slice(0, 60),
  });

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  revalidatePath("/store/account");

  return {
    ok: true,
    id: created.id,
    createdAt: created.createdAt.toISOString(),
  };
}
