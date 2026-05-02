"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { logActivity } from "@/lib/activity";

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
