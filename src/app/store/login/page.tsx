import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { CustomerAuthForm } from "@/components/store/customer-auth-form";

export const metadata = { title: "Sign in" };

export default async function StoreLoginPage() {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/store/account");

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
            Welcome back
          </h1>
          <p className="mt-3 text-sm text-[var(--color-fg-muted)]">
            Sign in to access your downloads.
          </p>
        </div>

        <CustomerAuthForm mode="login" />

        <p className="mt-6 text-center text-sm text-[var(--color-fg-muted)]">
          Don&apos;t have an account yet?{" "}
          <Link
            href="/store/signup"
            className="text-[var(--color-accent)] hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </section>
  );
}
