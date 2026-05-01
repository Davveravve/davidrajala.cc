import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Setup2faFlow } from "@/components/admin/setup-2fa-flow";

export const metadata = {
  title: "Set up 2FA — Admin",
  robots: { index: false, follow: false },
};

export default async function Setup2faPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  const user = await prisma.adminUser.findFirst({ select: { totpSecret: true } });
  if (user?.totpSecret) {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--color-bg)]">
      <div className="absolute inset-0 bg-grid" aria-hidden />
      <div className="absolute inset-0 bg-radial-fade" aria-hidden />

      <div className="relative w-full max-w-lg mx-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] pulse-dot" />
            Security
          </div>
          <h1 className="font-display text-4xl font-medium tracking-tight">
            Set up 2FA
          </h1>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)] max-w-sm mx-auto">
            Scan the QR code with Google Authenticator, Authy, or 1Password — then
            6-digit codes become your sign-in.
          </p>
        </div>

        <Setup2faFlow />
      </div>
    </div>
  );
}
