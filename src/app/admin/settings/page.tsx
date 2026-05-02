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
    </div>
  );
}
