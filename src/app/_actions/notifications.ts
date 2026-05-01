"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { sendTelegramMessage, getNotificationSettings } from "@/lib/telegram";

const schema = z.object({
  telegramEnabled: z.boolean().default(false),
  telegramToken: z.string().max(200).default(""),
  telegramChatId: z.string().max(60).default(""),
});

function fdToBool(v: FormDataEntryValue | null) {
  return v === "on" || v === "true" || v === "1";
}

export async function updateNotifications(formData: FormData) {
  await ensureAdmin();
  const data = schema.parse({
    telegramEnabled: fdToBool(formData.get("telegramEnabled")),
    telegramToken: String(formData.get("telegramToken") ?? ""),
    telegramChatId: String(formData.get("telegramChatId") ?? ""),
  });

  await prisma.notificationSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });

  revalidatePath("/admin/installningar");
}

export async function sendTestTelegramMessage(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  await ensureAdmin();
  const s = await getNotificationSettings();
  if (!s.telegramToken || !s.telegramChatId) {
    return { ok: false, error: "Bot token and chat ID must be filled in first" };
  }
  const res = await sendTelegramMessage(s.telegramToken, s.telegramChatId, {
    text:
      "<b>✅ Test from your portfolio admin</b>\n\n" +
      "Telegram notifications are configured correctly. New chat messages will arrive here.",
  });
  if (!res.ok) return { ok: false, error: res.error };
  return { ok: true };
}
