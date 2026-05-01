import { AdminShell } from "@/components/admin/admin-shell";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminContextProvider } from "@/components/admin/admin-context";

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

  const user = await prisma.adminUser.findFirst({ select: { totpSecret: true } });
  const has2fa = !!user?.totpSecret;

  return (
    <AdminContextProvider has2fa={has2fa}>
      <AdminShell email={session.user.email ?? ""}>{children}</AdminShell>
    </AdminContextProvider>
  );
}
