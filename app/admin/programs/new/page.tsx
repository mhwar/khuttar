import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramForm } from "@/components/admin/program-form";

export default async function NewProgramPage() {
  await requireAdmin();
  const destinations = await db.destination.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader title="برنامج جديد" />
      <ProgramForm destinations={destinations} isAdmin backTo="/admin/programs" />
    </>
  );
}
