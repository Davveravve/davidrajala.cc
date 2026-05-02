"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { notifyNewMessage } from "@/lib/telegram";
import { CUSTOMER_SENDER, threadKeyFor } from "@/lib/chat-thread";
import { emitChatMessage } from "@/lib/chat-bus";

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

// Per-IP submit-cooldown (separate from the burst rate limit above).
// Rejects any submit that comes <30s after the previous one from the same IP.
const lastSubmit = new Map<string, number>();
const SUBMIT_COOLDOWN_MS = 30_000;
const SUBMIT_MAP_LIMIT = 1000;

function checkSubmitCooldown(ip: string): boolean {
  const now = Date.now();
  const last = lastSubmit.get(ip);
  if (last && now - last < SUBMIT_COOLDOWN_MS) return false;

  // purge oldest when full
  if (lastSubmit.size >= SUBMIT_MAP_LIMIT && !lastSubmit.has(ip)) {
    const oldestKey = lastSubmit.keys().next().value;
    if (oldestKey !== undefined) lastSubmit.delete(oldestKey);
  }
  lastSubmit.set(ip, now);
  return true;
}

const GENERIC_REJECT = "Could not send — try again later";

type ContactDetailInput = {
  type: string;
  value: string;
  label?: string;
};

export type SendContactInput = {
  name: string;
  message: string;
  contacts: ContactDetailInput[];
  /** Honeypot field — bots fill it, humans don't. Non-empty => silently drop. */
  website?: string;
};

export async function sendChatMessage(
  input: SendContactInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  // Honeypot — if filled, pretend success but never store.
  if (input.website && input.website.trim().length > 0) {
    return { ok: true };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";

  if (!checkSubmitCooldown(ip)) {
    return { ok: false, error: GENERIC_REJECT };
  }

  if (!rateLimit(ip)) {
    return { ok: false, error: "Too many attempts. Try again in a minute." };
  }

  // Hard length cap (defence-in-depth on top of zod's max(5000)).
  if (typeof input.message === "string" && input.message.length > 5000) {
    return { ok: false, error: GENERIC_REJECT };
  }

  // Bare-URL spam heuristic — 4+ links in one message is almost always spam.
  if (typeof input.message === "string") {
    const urlMatches = input.message.match(/https?:\/\//gi);
    if (urlMatches && urlMatches.length >= 4) {
      return { ok: false, error: GENERIC_REJECT };
    }
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const data = parsed.data;
  const primaryEmail =
    data.contacts.find((c) => c.type === "mail")?.value ?? "";

  const created = await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: primaryEmail,
      message: data.message,
      senderType: CUSTOMER_SENDER,
      threadKey: threadKeyFor(primaryEmail),
      contacts: {
        create: data.contacts.map((c) => ({
          type: c.type,
          value: c.value,
          label: c.label ?? "",
        })),
      },
    },
  });

  // Push to live SSE listeners — chat panel sees their own message echoed
  // back if subscribed, admin gets an instant toast.
  emitChatMessage({
    threadKey: threadKeyFor(primaryEmail),
    message: {
      id: created.id,
      senderType: "customer",
      message: created.message,
      createdAt: created.createdAt.toISOString(),
      name: created.name,
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
  const website = String(formData.get("website") ?? "");
  return sendChatMessage({
    name,
    message,
    contacts: email ? [{ type: "mail", value: email }] : [],
    website,
  });
}
