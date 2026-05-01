import bcrypt from "bcryptjs";
import { auth } from "./auth";
import { prisma } from "./prisma";
import { verifyTotp } from "./totp";

export async function ensureAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

/**
 * Used by destructive/sensitive server actions: delete project, change about-me, etc.
 * Requires the user to be logged in AND submit a fresh verification value:
 *   - 6-digit TOTP code if 2FA is configured
 *   - the password if 2FA is not configured (dev/initial state)
 */
export async function ensureAdminWithReauth(verification: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id?: string }).id;
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Unauthorized");

  const value = String(verification ?? "").trim();
  if (!value) throw new Error("Verification required");

  if (user.totpSecret) {
    if (!verifyTotp(value, user.totpSecret)) throw new Error("Invalid code");
  } else {
    const ok = await bcrypt.compare(value, user.passwordHash);
    if (!ok) throw new Error("Wrong password");
  }

  return session;
}

// kept for backwards compatibility
export const ensureAdminWith2FA = ensureAdminWithReauth;
