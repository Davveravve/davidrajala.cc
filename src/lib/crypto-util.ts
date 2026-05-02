import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

/// AES-256-GCM encrypt/decrypt for storing secrets at rest. The encryption
/// key is derived deterministically from AUTH_SECRET (which lives in .env),
/// so a leaked database alone is not enough to recover plaintext.

function key(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET not configured");
  return createHash("sha256").update("crypto-util:" + secret).digest();
}

const PREFIX = "v1:";

/// Encrypt a UTF-8 string. Returns "v1:<iv-hex>:<tag-hex>:<cipher-hex>".
/// Empty input returns an empty string (so empty secrets stay empty in DB).
export function encryptString(plaintext: string): string {
  if (!plaintext) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + iv.toString("hex") + ":" + tag.toString("hex") + ":" + enc.toString("hex");
}

/// Decrypt an encryptString output. Returns "" if the value is empty,
/// throws if it can't be decrypted (key mismatch, tampering).
export function decryptString(encoded: string): string {
  if (!encoded) return "";
  if (!encoded.startsWith(PREFIX)) {
    throw new Error("Unsupported encrypted format");
  }
  const parts = encoded.slice(PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Malformed encrypted value");
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const data = Buffer.from(parts[2], "hex");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

/// Mask a secret for display in admin (e.g. "sk_test_…2akQ"). Never returns
/// the raw secret.
export function maskSecret(value: string, visible: number = 4): string {
  if (!value) return "";
  if (value.length <= visible) return "•".repeat(value.length);
  return value.slice(0, value.startsWith("sk_") || value.startsWith("pk_") || value.startsWith("whsec_") ? value.indexOf("_") + 1 : 4) + "…" + value.slice(-visible);
}
