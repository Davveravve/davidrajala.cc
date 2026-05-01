"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notifyNewMessage } from "@/lib/telegram";

const detailSchema = z.object({
  type: z.string().min(1).max(40),
  value: z.string().min(1).max(500),
  label: z.string().max(60).optional(),
});

const schema = z.object({
  name: z.string().min(1, "Name required").max(120),
  message: z.string().min(5, "Message is too short").max(5000),
  contacts: z.array(detailSchema).min(1, "Add at least one way to reach you"),
});

const ipBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = ipBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    ipBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX) return false;
  bucket.count++;
  return true;
}

type ContactDetailInput = {
  type: string;
  value: string;
  label?: string;
};

export type SendContactInput = {
  name: string;
  message: string;
  contacts: ContactDetailInput[];
};

export async function sendChatMessage(
  input: SendContactInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "unknown";

  if (!rateLimit(ip)) {
    return { ok: false, error: "Too many attempts. Try again in a minute." };
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const data = parsed.data;
  const primaryEmail =
    data.contacts.find((c) => c.type === "mail")?.value ?? "";

  await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: primaryEmail,
      message: data.message,
      contacts: {
        create: data.contacts.map((c) => ({
          type: c.type,
          value: c.value,
          label: c.label ?? "",
        })),
      },
    },
  });

  // fire-and-forget Telegram notification — don't block on or expose errors
  notifyNewMessage({
    name: data.name,
    message: data.message,
    contacts: data.contacts.map((c) => ({
      type: c.type,
      value: c.value,
      label: c.label,
    })),
  }).catch(() => {});

  return { ok: true };
}

// kept for the /kontakt fallback form (single email field)
export async function sendContactMessage(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const message = String(formData.get("message") ?? "");
  return sendChatMessage({
    name,
    message,
    contacts: email ? [{ type: "mail", value: email }] : [],
  });
}
