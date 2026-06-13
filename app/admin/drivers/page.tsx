import { PencilIcon, PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteDriver, saveDriver } from "@/lib/actions/misc";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/misc";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { NativeSelect } from "@/components/shared/native-select";
import { AreaSelect, type AreaOption } from "@/components/shared/area-select";
import { loadAreaData } from "@/lib/areas";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Driver, ServiceProvider } from "@prisma/client";

function DriverFormFields({
  providers,
  areas,
  value,
}: {
  providers: ServiceProvider[];
  areas: AreaOption[];
  value?: Driver;
}) {
  return (
    <>
      {value && <input type="hidden" name="id" value={value.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar.fields.name} name="name">
          <Input name="name" defaultValue={value?.name} required />
        </Field>
        <Field label={ar.fields.phone} name="phone">
          <Input name="phone" dir="ltr" defaultValue={value?.phone} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={ar.fields.city} name="city">
          <Input name="city" defaultValue={value?.city ?? ""} />
        </Field>
        <Field label={ar.fields.vehicleType} name="vehicleType">
          <Input
            name="vehicleType"
            placeholder="جمس يوكن، فان..."
            defaultValue={value?.vehicleType ?? ""}
          />
        </Field>
        <Field label={ar.fields.capacity} name="capacity">
          <Input name="capacity" type="number" defaultValue={value?.capacity ?? ""} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={ar.fields.serviceArea}
          name="areaId"
          hint="اربط السائق بمنطقة أو مدينة — يظهر مقترحاً عند إسناد النقل فيها"
        >
          <AreaSelect name="areaId" areas={areas} defaultValue={value?.areaId} />
        </Field>
        <Field label={ar.fields.vehiclePlate} name="vehiclePlate">
          <Input name="vehiclePlate" dir="ltr" defaultValue={value?.vehiclePlate ?? ""} />
        </Field>
      </div>
      <Field label="تابع لمزوّد" name="providerId">
        <NativeSelect name="providerId" defaultValue={value?.providerId ?? ""}>
          <option value="">مستقل</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label={ar.fields.notes} name="notes">
        <Textarea name="notes" defaultValue={value?.notes ?? ""} rows={2} />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={value ? value.status === "ACTIVE" : true}
          className="size-4 accent-primary"
        />
        {ar.fields.active}
      </label>
    </>
  );
}

export default async function AdminDriversPage() {
  await requireAdmin();
  const [drivers, providers, { options: areas }] = await Promise.all([
    db.driver.findMany({
      orderBy: { name: "asc" },
      include: {
        provider: { select: { name: true } },
        area: { select: { name: true } },
        _count: { select: { transfers: true } },
      },
    }),
    db.serviceProvider.findMany({
      where: { type: "TRANSPORT", status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    loadAreaData(),
  ]);

  return (
    <>
      <PageHeader
        title={ar.admin.drivers}
        description="السائقون المتعاونون — أفراد أو تابعون لشركات نقل"
        actions={
          <FormDialog
            title="إضافة سائق"
            action={saveDriver}
            wide
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                {ar.actions.create}
              </Button>
            }
          >
            <DriverFormFields providers={providers} areas={areas} />
          </FormDialog>
        }
      />

      <Card>
        <CardContent>
          {drivers.length === 0 ? (
            <EmptyState message="أضف السائقين لإسناد خدمات النقل إليهم" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ar.fields.name}</TableHead>
                  <TableHead>{ar.fields.phone}</TableHead>
                  <TableHead>{ar.fields.serviceArea}</TableHead>
                  <TableHead>المركبة</TableHead>
                  <TableHead>{ar.fields.provider}</TableHead>
                  <TableHead>الرحلات</TableHead>
                  <TableHead>{ar.fields.status}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell dir="ltr">{driver.phone}</TableCell>
                    <TableCell>{driver.area?.name ?? driver.city ?? "—"}</TableCell>
                    <TableCell>
                      {driver.vehicleType ?? "—"}
                      {driver.capacity ? ` (${driver.capacity})` : ""}
                    </TableCell>
                    <TableCell>{driver.provider?.name ?? "مستقل"}</TableCell>
                    <TableCell>{driver._count.transfers}</TableCell>
                    <TableCell>
                      <Badge
                        variant={driver.status === "ACTIVE" ? "default" : "outline"}
                      >
                        {driver.status === "ACTIVE" ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <FormDialog
                          title={`تعديل: ${driver.name}`}
                          action={saveDriver}
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
                          <DriverFormFields
                            providers={providers}
                            areas={areas}
                            value={driver}
                          />
                        </FormDialog>
                        <ConfirmDeleteButton
                          action={deleteDriver.bind(null, driver.id)}
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
