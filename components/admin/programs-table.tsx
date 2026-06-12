import Link from "next/link";
import {
  BadgeCheckIcon,
  BadgeXIcon,
  CalendarRangeIcon,
  ExternalLinkIcon,
  PencilIcon,
} from "lucide-react";
import { deleteProgram, setProgramApproval } from "@/lib/actions/programs";
import { labelOf } from "@/lib/constants";
import { formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { EmptyState } from "@/components/shared/misc";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete";
import { ActionButton } from "@/components/shared/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Prisma } from "@prisma/client";

type ProgramRow = Prisma.ProgramGetPayload<{
  include: {
    destination: { select: { name: true } };
    ownerAgent: { include: { user: { select: { name: true } } } };
    _count: { select: { bookings: true; days: true } };
  };
}>;

export function ProgramsTable({
  programs,
  basePath,
  isAdmin,
}: {
  programs: ProgramRow[];
  basePath: "/admin" | "/agent";
  isAdmin: boolean;
}) {
  if (programs.length === 0) {
    return <EmptyState message="لا توجد برامج بعد — أنشئ أول برنامج" />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{ar.fields.title}</TableHead>
          <TableHead>{ar.fields.category}</TableHead>
          <TableHead>{ar.fields.destination}</TableHead>
          {isAdmin && <TableHead>المالك</TableHead>}
          <TableHead>{ar.fields.price}</TableHead>
          <TableHead>{ar.fields.status}</TableHead>
          <TableHead>الموافقة</TableHead>
          <TableHead className="w-40"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {programs.map((program) => {
          const publicPath =
            program.category === "STUDY"
              ? `/study/${program.slug}`
              : `/programs/${program.slug}`;
          return (
            <TableRow key={program.id}>
              <TableCell>
                <Link
                  href={`${basePath}/programs/${program.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {program.title}
                </Link>
                {program.featured && (
                  <Badge variant="secondary" className="ms-2">
                    {ar.fields.featured}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground">
                  {program._count.days > 0 && `${program._count.days} ${ar.misc.days} • `}
                  {program._count.bookings} حجز
                </p>
              </TableCell>
              <TableCell>{labelOf("programCategory", program.category)}</TableCell>
              <TableCell>{program.destination?.name ?? "—"}</TableCell>
              {isAdmin && (
                <TableCell>
                  {program.ownerAgent
                    ? program.ownerAgent.user.name
                    : ar.misc.platformOwned}
                </TableCell>
              )}
              <TableCell>{formatSAR(program.basePrice)}</TableCell>
              <TableCell>
                <Badge
                  variant={program.status === "PUBLISHED" ? "default" : "outline"}
                >
                  {labelOf("programStatus", program.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {program.isApproved ? (
                  <Badge variant="secondary">{ar.misc.approvedByAdmin}</Badge>
                ) : (
                  <Badge variant="destructive">{ar.misc.needsApproval}</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  {isAdmin && (
                    <ActionButton
                      action={setProgramApproval.bind(
                        null,
                        program.id,
                        !program.isApproved,
                      )}
                      variant="ghost"
                      size="icon-sm"
                      title={
                        program.isApproved ? "إلغاء الموافقة" : ar.actions.approve
                      }
                    >
                      {program.isApproved ? (
                        <BadgeXIcon className="size-4 text-amber-600" />
                      ) : (
                        <BadgeCheckIcon className="size-4 text-emerald-600" />
                      )}
                    </ActionButton>
                  )}
                  {program.category === "TOUR" && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      asChild
                      title="جدول الرحلة"
                    >
                      <Link href={`${basePath}/programs/${program.id}/itinerary`}>
                        <CalendarRangeIcon className="size-4" />
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon-sm" asChild title={ar.actions.edit}>
                    <Link href={`${basePath}/programs/${program.id}`}>
                      <PencilIcon className="size-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    asChild
                    title="عرض الصفحة العامة"
                  >
                    <Link href={publicPath} target="_blank">
                      <ExternalLinkIcon className="size-4" />
                    </Link>
                  </Button>
                  <ConfirmDeleteButton action={deleteProgram.bind(null, program.id)} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
