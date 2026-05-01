import { LoginForm } from "@/components/admin/login-form";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Admin login — David Rajala",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const user = await prisma.adminUser.findFirst({ select: { totpSecret: true } });
  const has2fa = !!user?.totpSecret;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)]">
      <div className="absolute inset-0 bg-grid" aria-hidden />
      <div className="absolute inset-0 bg-radial-fade" aria-hidden />

      <div className="relative w-full max-w-md mx-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] pulse-dot" />
            Admin Panel
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight">
            {has2fa ? "Verify code" : "Sign in"}
          </h1>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            {has2fa
              ? "Enter the 6-digit code from your authenticator."
              : "Enter your password. Set up 2FA in the next step."}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
          <LoginForm has2fa={has2fa} />
        </div>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-dim)]">
          Protected zone — all attempts are logged
        </p>
      </div>
    </div>
  );
}
