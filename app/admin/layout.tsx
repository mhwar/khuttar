import { requireAdmin } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { ar } from "@/lib/i18n/ar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <DashboardShell
      variant="admin"
      title={ar.admin.title}
      userName={user.name}
      logoutAction={logout}
    >
      {children}
    </DashboardShell>
  );
}
