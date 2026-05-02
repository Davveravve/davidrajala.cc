import Stripe from "stripe";
import { prisma } from "./prisma";
import { decryptString } from "./crypto-util";

export type StripeRuntimeConfig = {
  enabled: boolean;
  mode: "test" | "live";
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  successPath: string;
  cancelPath: string;
};

export async function getStripeSettings(): Promise<StripeRuntimeConfig | null> {
  const row = await prisma.stripeSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  let secretKey = "";
  let webhookSecret = "";
  try {
    secretKey = row.encryptedSecretKey ? decryptString(row.encryptedSecretKey) : "";
    webhookSecret = row.encryptedWebhookSecret ? decryptString(row.encryptedWebhookSecret) : "";
  } catch {
    return null;
  }

  return {
    enabled: row.enabled,
    mode: row.mode === "live" ? "live" : "test",
    publishableKey: row.publishableKey,
    secretKey,
    webhookSecret,
    successPath: row.successPath,
    cancelPath: row.cancelPath,
  };
}

let cachedKey: string | null = null;
let cachedClient: Stripe | null = null;

/// Returns a Stripe client using the active configured secret key.
/// Cached per-process; rebuilt when the key changes.
export async function getStripeClient(): Promise<Stripe | null> {
  const cfg = await getStripeSettings();
  if (!cfg || !cfg.enabled || !cfg.secretKey) return null;
  if (cachedKey === cfg.secretKey && cachedClient) return cachedClient;
  cachedKey = cfg.secretKey;
  cachedClient = new Stripe(cfg.secretKey);
  return cachedClient;
}

/// Public-safe view (no secrets), for sending to the admin UI.
export type StripeAdminView = {
  enabled: boolean;
  mode: "test" | "live";
  publishableKey: string;
  hasSecret: boolean;
  hasWebhookSecret: boolean;
  successPath: string;
  cancelPath: string;
};

export async function getStripeAdminView(): Promise<StripeAdminView> {
  const cfg = await getStripeSettings();
  return {
    enabled: cfg?.enabled ?? false,
    mode: cfg?.mode ?? "test",
    publishableKey: cfg?.publishableKey ?? "",
    hasSecret: !!cfg?.secretKey,
    hasWebhookSecret: !!cfg?.webhookSecret,
    successPath: cfg?.successPath ?? "/store/checkout/success",
    cancelPath: cfg?.cancelPath ?? "/store",
  };
}
