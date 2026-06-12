import { requireAgent } from "@/lib/auth";
import { logout } from "@/lib/actions/auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { ar } from "@/lib/i18n/ar";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await requireAgent();

  return (
    <DashboardShell
      variant="agent"
      title={ar.agent.title}
      userName={user.name}
      logoutAction={logout}
    >
      {profile.status === "PENDING" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {ar.agent.pendingNotice}
        </div>
      )}
      {profile.status === "SUSPENDED" && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {ar.agent.suspendedNotice}
        </div>
      )}
      {children}
    </DashboardShell>
  );
}
