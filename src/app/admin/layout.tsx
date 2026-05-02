import { AdminShell } from "@/components/admin/admin-shell";
import { AdminToaster } from "@/components/notifications/admin-toaster";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Admin Panel — David Rajala",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <>
      <AdminShell email={session.user.email ?? ""}>{children}</AdminShell>
      <AdminToaster />
    </>
  );
}
