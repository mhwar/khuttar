import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAgent } from "@/lib/auth";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramsTable } from "@/components/admin/programs-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function AgentProgramsPage() {
  const { profile } = await requireAgent();

  const programs = await db.program.findMany({
    where: { ownerAgentId: profile.id },
    orderBy: { createdAt: "desc" },
    include: {
      destination: { select: { name: true } },
      ownerAgent: { include: { user: { select: { name: true } } } },
      _count: { select: { bookings: true, days: true } },
    },
  });

  return (
    <>
      <PageHeader
        title={ar.agent.myPrograms}
        description="ابنِ برامجك وجداولك وشاركها مع عملائك — تظهر للعموم بعد موافقة الإدارة"
        actions={
          profile.status === "APPROVED" ? (
            <Button asChild>
              <Link href="/agent/programs/new">
                <PlusIcon className="size-4" />
                {ar.actions.create}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent>
          <ProgramsTable programs={programs} basePath="/agent" isAdmin={false} />
        </CardContent>
      </Card>
    </>
  );
}
