import Link from "next/link";
import {
  MapIcon,
  NotebookTextIcon,
  WalletIcon,
  LinkIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/auth";
import { getAgentBalance } from "@/lib/queries";
import { formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/misc";
import { CopyButton } from "@/components/shared/copy-button";
import { BookingsTable } from "@/components/admin/bookings-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AgentOverviewPage() {
  const { user, profile } = await requireAgent();

  const [bookingsCount, programsCount, balance, recentBookings] =
    await Promise.all([
      db.bookingRequest.count({ where: { agentId: profile.id } }),
      db.program.count({ where: { ownerAgentId: profile.id } }),
      getAgentBalance(profile.id),
      db.bookingRequest.findMany({
        where: { agentId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { agent: { include: { user: { select: { name: true } } } } },
      }),
    ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const referralLink = `${appUrl}/programs?ref=${profile.referralCode}`;

  return (
    <>
      <PageHeader
        title={`أهلاً ${user.name}`}
        description="ملخص نشاطك في منصة خطار"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={ar.agent.myBookings}
          value={bookingsCount}
          icon={<NotebookTextIcon className="size-8" />}
        />
        <StatCard
          label={ar.agent.myPrograms}
          value={programsCount}
          icon={<MapIcon className="size-8" />}
        />
        <StatCard
          label={ar.agent.balance}
          value={formatSAR(balance)}
          icon={<WalletIcon className="size-8" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="size-4" />
            {ar.agent.referralLink}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">{ar.agent.referralHint}</p>
          <p className="break-all rounded-md bg-muted p-2 text-xs" dir="ltr">
            {referralLink}
          </p>
          <div>
            <CopyButton text={referralLink} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أحدث حجوزاتك</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingsTable
            bookings={recentBookings}
            basePath="/agent"
            showAgent={false}
          />
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        <Link href="/agent/bookings" className="text-primary hover:underline">
          عرض كل الحجوزات ←
        </Link>
      </p>
    </>
  );
}
