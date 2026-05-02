import { Download } from "lucide-react";
import { getNotificationSettings } from "@/lib/telegram";
import { NotificationsForm } from "@/components/admin/notifications-form";

export default async function AdminSettingsPage() {
  const settings = await getNotificationSettings();

  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <div className="mb-10">
        <div className="text-[10px] uppercase tracking-[0.12em] font-medium text-[var(--color-fg-muted)] mb-3">
          Settings
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">
          Notifications & integrations
        </h1>
      </div>

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
