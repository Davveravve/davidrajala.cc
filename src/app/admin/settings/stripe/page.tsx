import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getStripeAdminView } from "@/lib/stripe-config";
import { StripeSettingsForm } from "@/components/admin/stripe-settings-form";

export const metadata = { title: "Stripe — Admin" };

export default async function StripeSettingsPage() {
  const view = await getStripeAdminView();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://davidrajala.cc";

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] transition-colors mb-8"
      >
        <ArrowLeft size={14} />
        Back to settings
      </Link>

      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Payments
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Stripe
        </h1>
        <p className="mt-3 text-sm text-[var(--color-fg-muted)] max-w-xl">
          Connects /store checkout to Stripe. Secret + webhook keys are
          AES-256-GCM encrypted before being saved — leaving them blank
          keeps whatever&apos;s already stored.
        </p>
      </div>

      <StripeSettingsForm initial={view} webhookUrl={`${siteUrl}/api/store/webhook`} />
    </div>
  );
}
