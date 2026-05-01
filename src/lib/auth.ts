import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { verifyTotp } from "./totp";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_MAX = 8;

export function checkLoginRate(ip: string): boolean {
  const now = Date.now();
  const bucket = loginAttempts.get(ip);
  if (!bucket || bucket.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return true;
  }
  if (bucket.count >= LOGIN_MAX) return false;
  bucket.count++;
  return true;
}

class AuthError extends CredentialsSignin {
  constructor(public override code: string) {
    super(code);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        password: { label: "Password", type: "password" },
        code: { label: "Code", type: "text" },
      },
      async authorize(creds) {
        const password = String(creds?.password ?? "");
        const code = String(creds?.code ?? "").replace(/\s/g, "");

        const user = await prisma.adminUser.findFirst();
        if (!user) {
          await bcrypt.compare("dummy", "$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsalti");
          throw new AuthError("invalid");
        }

        // After 2FA setup → code-only login. Password is no longer used.
        if (user.totpSecret) {
          if (!code || !/^\d{6}$/.test(code)) throw new AuthError("invalid");
          if (!verifyTotp(code, user.totpSecret)) throw new AuthError("invalid");
          return { id: user.id, email: user.email };
        }

        // Pre-2FA: password-only. After login user is forced to /admin/setup-2fa.
        if (!password) throw new AuthError("invalid");
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new AuthError("invalid");
        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        const fresh = await prisma.adminUser.findUnique({ where: { id: user.id } });
        token.has2fa = !!fresh?.totpSecret;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string; has2fa?: boolean }).id = token.sub;
        (session.user as { id?: string; has2fa?: boolean }).has2fa = Boolean(token.has2fa);
      }
      return session;
    },
  },
});
