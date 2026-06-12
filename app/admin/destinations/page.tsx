import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteDestination, saveDestination } from "@/lib/actions/catalog";
import { labelOf } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/misc";
import { FormDialog } from "@/components/shared/form-dialog";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete";
import { DestinationFormFields } from "@/components/admin/destination-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminDestinationsPage() {
  await requireAdmin();

  const destinations = await db.destination.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { areas: true, programs: true } } },
  });

  return (
    <>
      <PageHeader
        title={ar.admin.destinations}
        description="الوجهات وتقسيماتها (مناطق، مدن، محافظات) والمعالم"
        actions={
          <FormDialog
            title="إضافة وجهة"
            action={saveDestination}
            wide
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                {ar.actions.create}
              </Button>
            }
          >
            <DestinationFormFields />
          </FormDialog>
        }
      />

      <Card>
        <CardContent>
          {destinations.length === 0 ? (
            <EmptyState message="أضف أول وجهة للبدء في بناء البرامج" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ar.fields.name}</TableHead>
                  <TableHead>{ar.fields.country}</TableHead>
                  <TableHead>{ar.fields.type}</TableHead>
                  <TableHead>المناطق</TableHead>
                  <TableHead>البرامج</TableHead>
                  <TableHead>{ar.fields.status}</TableHead>
                  <TableHead className="w-28"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {destinations.map((destination) => (
                  <TableRow key={destination.id}>
                    <TableCell>
                      <Link
                        href={`/admin/destinations/${destination.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {destination.name}
                      </Link>
                      {destination.featured && (
                        <Badge variant="secondary" className="ms-2">
                          {ar.fields.featured}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{destination.country}</TableCell>
                    <TableCell>
                      {labelOf("destinationType", destination.type)}
                    </TableCell>
                    <TableCell>{destination._count.areas}</TableCell>
                    <TableCell>{destination._count.programs}</TableCell>
                    <TableCell>
                      <Badge variant={destination.active ? "default" : "outline"}>
                        {destination.active ? "نشطة" : "معطلة"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <FormDialog
                          title={`تعديل: ${destination.name}`}
                          action={saveDestination}
                          wide
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={ar.actions.edit}
                            >
                              <PencilIcon className="size-4" />
                            </Button>
                          }
                        >
                          <DestinationFormFields value={destination} />
                        </FormDialog>
                        <ConfirmDeleteButton
                          action={deleteDestination.bind(null, destination.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
