"use server";

import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  generateTotpSecret,
  buildOtpauth,
  buildQrSvg,
  signSetupToken,
  verifySetupToken,
  verifyTotp,
  SETUP_COOKIE,
} from "@/lib/totp";

const SETUP_TTL_S = 10 * 60;

export async function startSetup(
  password: string,
): Promise<
  | { ok: true; qrSvg: string; secret: string }
  | { ok: false; error: string }
> {
  const user = await prisma.adminUser.findFirst();
  if (!user) return { ok: false, error: "No admin account found" };
  if (user.totpSecret) return { ok: false, error: "2FA is already configured" };

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { ok: false, error: "Wrong password" };

  const secret = generateTotpSecret();
  const otpauth = buildOtpauth(secret, user.email || "admin");
  const qrSvg = await buildQrSvg(otpauth);

  const token = await signSetupToken({ secret, userId: user.id });
  const c = await cookies();
  c.set(SETUP_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: SETUP_TTL_S,
    path: "/",
  });

  return { ok: true, qrSvg, secret };
}

export async function confirmSetup(
  code: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await cookies();
  const token = c.get(SETUP_COOKIE)?.value;
  if (!token) return { ok: false, error: "Setup session expired" };

  const payload = await verifySetupToken(token);
  if (!payload) return { ok: false, error: "Setup session is invalid" };

  if (!verifyTotp(code, payload.secret)) {
    return { ok: false, error: "Invalid code" };
  }

  await prisma.adminUser.update({
    where: { id: payload.userId },
    data: { totpSecret: payload.secret },
  });

  c.delete(SETUP_COOKIE);
  return { ok: true };
}
