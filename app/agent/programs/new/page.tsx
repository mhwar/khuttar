import { db } from "@/lib/db";
import { requireAgent } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramForm } from "@/components/admin/program-form";

export default async function AgentNewProgramPage() {
  await requireAgent();
  const destinations = await db.destination.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader
        title="برنامج جديد"
        description="بعد الحفظ أضف جدول الرحلة، ثم تنتظر موافقة الإدارة للظهور العام"
      />
      <ProgramForm
        destinations={destinations}
        isAdmin={false}
        backTo="/agent/programs"
      />
    </>
  );
}
