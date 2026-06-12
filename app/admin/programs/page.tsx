import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { ProgramsTable } from "@/components/admin/programs-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/shared/native-select";
import { LABELS, PROGRAM_CATEGORIES, PROGRAM_STATUSES } from "@/lib/constants";

export default async function AdminProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>;
}) {
  await requireAdmin();
  const { category, status } = await searchParams;

  const programs = await db.program.findMany({
    where: {
      ...(category && PROGRAM_CATEGORIES.includes(category as never)
        ? { category }
        : {}),
      ...(status && PROGRAM_STATUSES.includes(status as never) ? { status } : {}),
    },
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
        title={ar.admin.programs}
        description="البرامج السياحية والدراسية — الإنشاء، الجداول، والموافقة على برامج الوكلاء"
        actions={
          <Button asChild>
            <Link href="/admin/programs/new">
              <PlusIcon className="size-4" />
              {ar.actions.create}
            </Link>
          </Button>
        }
      />

      <form className="flex flex-wrap items-end gap-3" method="GET">
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">{ar.fields.category}</label>
          <NativeSelect name="category" defaultValue={category ?? ""} className="w-44">
            <option value="">{ar.misc.all}</option>
            {PROGRAM_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {LABELS.programCategory[c]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium">{ar.fields.status}</label>
          <NativeSelect name="status" defaultValue={status ?? ""} className="w-44">
            <option value="">{ar.misc.all}</option>
            {PROGRAM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LABELS.programStatus[s]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <Button variant="outline" type="submit">
          {ar.actions.filter}
        </Button>
      </form>

      <Card>
        <CardContent>
          <ProgramsTable programs={programs} basePath="/admin" isAdmin />
        </CardContent>
      </Card>
    </>
  );
}
