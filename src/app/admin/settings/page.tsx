import Link from "next/link";
import {
  Download,
  User,
  Tag,
  Mail,
  ArrowUpRight,
  CreditCard,
} from "lucide-react";
import { getNotificationSettings } from "@/lib/telegram";
import { NotificationsForm } from "@/components/admin/notifications-form";
import { getStripeAdminView } from "@/lib/stripe-config";

export default async function AdminSettingsPage() {
  const settings = await getNotificationSettings();
  const stripe = await getStripeAdminView();

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Settings
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Settings
        </h1>
      </div>

      <section className="mb-12">
        <h2 className="font-display text-lg font-medium mb-4">Quick links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickLink href="/admin/about" label="Profile / About" icon={User} />
          <QuickLink href="/admin/categories" label="Project categories" icon={Tag} />
          <QuickLink href="/admin/messages" label="Messages inbox" icon={Mail} />
          <QuickLink
            href="/admin/settings/stripe"
            label={
              stripe.enabled
                ? `Stripe — ${stripe.mode} mode`
                : "Stripe — not enabled"
            }
            icon={CreditCard}
            highlight={stripe.enabled}
          />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="font-display text-lg font-medium mb-4">
          Notifications & integrations
        </h2>
      </section>

      <NotificationsForm
        initial={{
          telegramEnabled: settings.telegramEnabled,
          telegramToken: settings.telegramToken,
          telegramChatId: settings.telegramChatId,
        }}
      />

      <section className="mt-12">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Backup
        </div>
        <h2 className="font-display text-2xl font-medium tracking-tight mb-4">
          Download a snapshot
        </h2>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--color-fg-muted)] max-w-md">
            Export every row from the database (projects, gallery, messages,
            settings) as a single JSON file. Sensitive fields like password
            hashes and 2FA secrets are excluded.
          </p>
          <a
            href="/admin/api/backup"
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow flex-shrink-0"
          >
            <Download size={14} />
            Download backup
          </a>
        </div>
      </section>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
  highlight,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl border p-4 transition-colors ${
        highlight
          ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 hover:border-[var(--color-accent)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]/50"
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-accent)]">
        <Icon size={14} />
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ArrowUpRight
        size={14}
        className="text-[var(--color-fg-muted)] group-hover:text-[var(--color-accent)] group-hover:rotate-45 transition-all duration-300"
      />
    </Link>
  );
}
