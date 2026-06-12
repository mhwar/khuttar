import { PencilIcon, PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteProvider, saveProvider } from "@/lib/actions/misc";
import { LABELS, PROVIDER_TYPES, labelOf } from "@/lib/constants";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/misc";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { NativeSelect, enumOptions } from "@/components/shared/native-select";
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
import type { ServiceProvider } from "@prisma/client";

function ProviderFormFields({ value }: { value?: ServiceProvider }) {
  return (
    <>
      {value && <input type="hidden" name="id" value={value.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={ar.fields.name} name="name">
          <Input name="name" defaultValue={value?.name} required />
        </Field>
        <Field label={ar.fields.type} name="type">
          <NativeSelect name="type" defaultValue={value?.type ?? "TRANSPORT"}>
            {enumOptions(PROVIDER_TYPES, LABELS.providerType)}
          </NativeSelect>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={ar.fields.contactName} name="contactName">
          <Input name="contactName" defaultValue={value?.contactName ?? ""} />
        </Field>
        <Field label={ar.fields.phone} name="phone">
          <Input name="phone" dir="ltr" defaultValue={value?.phone ?? ""} />
        </Field>
        <Field label={ar.fields.city} name="city">
          <Input name="city" defaultValue={value?.city ?? ""} />
        </Field>
      </div>
      <Field label={ar.fields.email} name="email">
        <Input name="email" type="email" dir="ltr" defaultValue={value?.email ?? ""} />
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

export default async function AdminProvidersPage() {
  await requireAdmin();
  const providers = await db.serviceProvider.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { drivers: true, transfers: true } } },
  });

  return (
    <>
      <PageHeader
        title={ar.admin.providers}
        description="وكالات وشركات الخدمات المتعاونة: نقل، فنادق، وغيرها"
        actions={
          <FormDialog
            title="إضافة مزوّد خدمة"
            action={saveProvider}
            wide
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                {ar.actions.create}
              </Button>
            }
          >
            <ProviderFormFields />
          </FormDialog>
        }
      />

      <Card>
        <CardContent>
          {providers.length === 0 ? (
            <EmptyState message="أضف مزوّدي الخدمات (نقل، فنادق...) للتنسيق معهم" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ar.fields.name}</TableHead>
                  <TableHead>{ar.fields.type}</TableHead>
                  <TableHead>{ar.fields.contactName}</TableHead>
                  <TableHead>{ar.fields.phone}</TableHead>
                  <TableHead>{ar.fields.city}</TableHead>
                  <TableHead>السائقون</TableHead>
                  <TableHead>{ar.fields.status}</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {labelOf("providerType", provider.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{provider.contactName ?? "—"}</TableCell>
                    <TableCell dir="ltr">{provider.phone ?? "—"}</TableCell>
                    <TableCell>{provider.city ?? "—"}</TableCell>
                    <TableCell>{provider._count.drivers}</TableCell>
                    <TableCell>
                      <Badge
                        variant={provider.status === "ACTIVE" ? "default" : "outline"}
                      >
                        {provider.status === "ACTIVE" ? "نشط" : "غير نشط"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <FormDialog
                          title={`تعديل: ${provider.name}`}
                          action={saveProvider}
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
                          <ProviderFormFields value={provider} />
                        </FormDialog>
                        <ConfirmDeleteButton
                          action={deleteProvider.bind(null, provider.id)}
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
