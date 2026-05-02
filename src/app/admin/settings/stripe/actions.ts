"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAdmin } from "@/lib/admin-guard";
import { encryptString } from "@/lib/crypto-util";
import { logActivity } from "@/lib/activity";

const SECRET_PLACEHOLDER = "__keep__";

const schema = z.object({
  enabled: z.boolean().default(false),
  mode: z.enum(["test", "live"]).default("test"),
  publishableKey: z.string().max(400).default(""),
  secretKey: z.string().max(400).default(""),
  webhookSecret: z.string().max(400).default(""),
  successPath: z.string().max(200).default("/store/checkout/success"),
  cancelPath: z.string().max(200).default("/store"),
});

function fdToBool(v: FormDataEntryValue | null) {
  return v === "on" || v === "true" || v === "1";
}

export async function updateStripeSettings(formData: FormData) {
  await ensureAdmin();
  const data = schema.parse({
    enabled: fdToBool(formData.get("enabled")),
    mode: formData.get("mode") ?? "test",
    publishableKey: String(formData.get("publishableKey") ?? "").trim(),
    secretKey: String(formData.get("secretKey") ?? "").trim(),
    webhookSecret: String(formData.get("webhookSecret") ?? "").trim(),
    successPath: String(formData.get("successPath") ?? "").trim() || "/store/checkout/success",
    cancelPath: String(formData.get("cancelPath") ?? "").trim() || "/store",
  });

  // Validate prefixes when changing secrets
  if (data.secretKey && data.secretKey !== SECRET_PLACEHOLDER) {
    if (!data.secretKey.startsWith("sk_test_") && !data.secretKey.startsWith("sk_live_")) {
      throw new Error("Secret key must start with sk_test_ or sk_live_");
    }
  }
  if (data.publishableKey) {
    if (!data.publishableKey.startsWith("pk_test_") && !data.publishableKey.startsWith("pk_live_")) {
      throw new Error("Publishable key must start with pk_test_ or pk_live_");
    }
  }
  if (data.webhookSecret && data.webhookSecret !== SECRET_PLACEHOLDER) {
    if (!data.webhookSecret.startsWith("whsec_")) {
      throw new Error("Webhook secret must start with whsec_");
    }
  }

  // Build the update payload — only overwrite secret fields when the user
  // actually typed something (so leaving blank means "keep existing").
  const update: Record<string, unknown> = {
    enabled: data.enabled,
    mode: data.mode,
    publishableKey: data.publishableKey,
    successPath: data.successPath,
    cancelPath: data.cancelPath,
  };
  if (data.secretKey && data.secretKey !== SECRET_PLACEHOLDER) {
    update.encryptedSecretKey = encryptString(data.secretKey);
  }
  if (data.webhookSecret && data.webhookSecret !== SECRET_PLACEHOLDER) {
    update.encryptedWebhookSecret = encryptString(data.webhookSecret);
  }

  await prisma.stripeSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...update },
    update,
  });

  await logActivity("stripe.update", {
    entityType: "stripe",
    label: data.enabled ? `enabled (${data.mode})` : "disabled",
  });

  revalidatePath("/admin/settings/stripe");
  revalidatePath("/admin/settings");
}
