import { prisma } from "./prisma";

type SendOpts = {
  text: string;
  parseMode?: "HTML" | "MarkdownV2";
  disableNotification?: boolean;
};

export type TelegramResult =
  | { ok: true; messageId: number }
  | { ok: false; error: string; status?: number };

export async function getNotificationSettings() {
  let s = await prisma.notificationSettings.findUnique({
    where: { id: "singleton" },
  });
  if (!s) {
    s = await prisma.notificationSettings.create({ data: { id: "singleton" } });
  }
  return s;
}

export async function sendTelegramMessage(
  token: string,
  chatId: string,
  opts: SendOpts,
): Promise<TelegramResult> {
  if (!token || !chatId) {
    return { ok: false, error: "Bot token or chat ID missing" };
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: opts.text,
          parse_mode: opts.parseMode ?? "HTML",
          disable_web_page_preview: true,
          disable_notification: opts.disableNotification ?? false,
        }),
        signal: AbortSignal.timeout(8_000),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: { message_id: number };
      description?: string;
    };
    if (!res.ok || !data.ok) {
      return {
        ok: false,
        status: res.status,
        error: data.description || `HTTP ${res.status}`,
      };
    }
    return { ok: true, messageId: data.result?.message_id ?? 0 };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function notifyNewMessage(opts: {
  name: string;
  message: string;
  contacts: { type: string; value: string; label?: string }[];
}): Promise<TelegramResult | null> {
  const s = await getNotificationSettings();
  if (!s.telegramEnabled || !s.telegramToken || !s.telegramChatId) return null;

  const lines: string[] = [
    `<b>📬 New message from ${escapeHtml(opts.name)}</b>`,
    "",
    `<i>${escapeHtml(opts.message).replace(/\n/g, "\n")}</i>`,
  ];

  if (opts.contacts.length > 0) {
    lines.push("", "<b>Contact details:</b>");
    for (const c of opts.contacts) {
      const label = c.label || c.type;
      lines.push(`• ${escapeHtml(label)}: <code>${escapeHtml(c.value)}</code>`);
    }
  }

  return sendTelegramMessage(s.telegramToken, s.telegramChatId, {
    text: lines.join("\n"),
  });
}
