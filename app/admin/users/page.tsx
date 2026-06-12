import { PencilIcon, PlusIcon } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { saveUser } from "@/lib/actions/misc";
import { labelOf } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/misc";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { NativeSelect } from "@/components/shared/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User } from "@prisma/client";

function UserFormFields({ value }: { value?: User }) {
  return (
    <>
      {value && <input type="hidden" name="id" value={value.id} />}
      <Field label={ar.fields.fullName} name="name">
        <Input name="name" defaultValue={value?.name} required />
      </Field>
      <Field label={ar.fields.email} name="email">
        <Input name="email" type="email" dir="ltr" defaultValue={value?.email} required />
      </Field>
      <Field
        label={ar.fields.password}
        name="password"
        hint={value ? "اتركه فارغاً للإبقاء على كلمة المرور الحالية" : "٨ أحرف على الأقل"}
      >
        <Input name="password" type="password" dir="ltr" />
      </Field>
      <Field label="الدور" name="role">
        <NativeSelect name="role" defaultValue={value?.role ?? "ADMIN"}>
          <option value="ADMIN">{labelOf("userRole", "ADMIN")}</option>
          <option value="AGENT">{labelOf("userRole", "AGENT")}</option>
        </NativeSelect>
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

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    include: { agentProfile: { select: { referralCode: true } } },
  });

  return (
    <>
      <PageHeader
        title={ar.admin.users}
        description="حسابات الدخول للوحة — لإنشاء وكيل جديد استخدم صفحة الوكلاء"
        actions={
          <FormDialog
            title="مستخدم جديد"
            action={saveUser}
            trigger={
              <Button>
                <PlusIcon className="size-4" />
                {ar.actions.create}
              </Button>
            }
          >
            <UserFormFields />
          </FormDialog>
        }
      />

      <Card>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{ar.fields.name}</TableHead>
                  <TableHead>{ar.fields.email}</TableHead>
                  <TableHead>الدور</TableHead>
                  <TableHead>{ar.fields.status}</TableHead>
                  <TableHead>{ar.misc.createdAt}</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell dir="ltr">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {labelOf("userRole", user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.status === "ACTIVE" ? "outline" : "destructive"}>
                        {labelOf("userStatus", user.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <FormDialog
                        title={`تعديل: ${user.name}`}
                        action={saveUser}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label={ar.actions.edit}>
                            <PencilIcon className="size-4" />
                          </Button>
                        }
                      >
                        <UserFormFields value={user} />
                      </FormDialog>
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
