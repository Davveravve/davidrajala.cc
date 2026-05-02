import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { ResetPasswordForm } from "@/components/store/reset-password-form";

export const metadata = { title: "Set a new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/store/account");

  const { token } = await searchParams;

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden">
      <div className="absolute inset-0 bg-grid-fine opacity-30" aria-hidden />
      <div className="absolute inset-0 bg-radial-fade" aria-hidden />
      <div className="container-page relative max-w-md">
        <div className="text-center mb-10">
          <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
            Store account
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
            Set a new password
          </h1>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            Pick a new password to sign back into your account.
          </p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 text-center">
            <p className="text-sm text-red-400">
              This reset link is missing or invalid.
            </p>
            <Link
              href="/store/forgot-password"
              className="mt-5 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-border)] text-sm hover:bg-[var(--color-surface-2)] transition-colors"
            >
              Request a new link
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
          Remembered it?{" "}
          <Link
            href="/store/login"
            className="text-[var(--color-accent)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
