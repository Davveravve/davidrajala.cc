import { authenticator } from "otplib";
import QRCode from "qrcode";
import { SignJWT, jwtVerify } from "jose";

authenticator.options = { window: 1, step: 30 };

const ISSUER = "Portfolio Admin";
const SETUP_TTL_SECONDS = 10 * 60;

function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET saknas");
  return new TextEncoder().encode(secret);
}

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpauth(secret: string, account = "admin") {
  return authenticator.keyuri(account, ISSUER, secret);
}

export async function buildQrSvg(otpauth: string): Promise<string> {
  return QRCode.toString(otpauth, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    width: 240,
    color: {
      dark: "#00e5ff",
      light: "#0f111700",
    },
  });
}

export function verifyTotp(code: string, secret: string): boolean {
  const trimmed = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(trimmed)) return false;
  try {
    return authenticator.verify({ token: trimmed, secret });
  } catch {
    return false;
  }
}

export async function signSetupToken(payload: {
  secret: string;
  userId: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SETUP_TTL_SECONDS}s`)
    .sign(getKey());
}

export async function verifySetupToken(
  token: string,
): Promise<{ secret: string; userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getKey());
    if (typeof payload.secret === "string" && typeof payload.userId === "string") {
      return { secret: payload.secret, userId: payload.userId };
    }
    return null;
  } catch {
    return null;
  }
}

export const SETUP_COOKIE = "totp-setup";
