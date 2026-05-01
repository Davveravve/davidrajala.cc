"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin, ensureAdminWith2FA } from "@/lib/admin-guard";

export async function markMessageRead(id: string, read: boolean) {
  await ensureAdmin();
  await prisma.contactMessage.update({ where: { id }, data: { read } });
  revalidatePath("/admin/meddelanden");
  revalidatePath("/admin");
}

export async function setMessageSaved(id: string, saved: boolean) {
  await ensureAdmin();
  await prisma.contactMessage.update({ where: { id }, data: { saved } });
  revalidatePath("/admin/meddelanden");
  revalidatePath("/admin");
}

export async function deleteMessage(id: string, totpCode: string) {
  await ensureAdminWith2FA(totpCode);
  await prisma.contactMessage.delete({ where: { id } });
  revalidatePath("/admin/meddelanden");
  revalidatePath("/admin");
}
