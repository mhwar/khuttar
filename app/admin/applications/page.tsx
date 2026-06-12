import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { createAgent, setApplicationStatus } from "@/lib/actions/agents";
import { labelOf } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/misc";
import { FormDialog } from "@/components/shared/form-dialog";
import { Field } from "@/components/shared/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/shared/action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function AdminApplicationsPage() {
  await requireAdmin();
  const applications = await db.agentApplication.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title={ar.admin.applications}
        description="طلبات الانضمام كوكلاء من صفحة «انضم كوكيل» — القبول ينشئ حساب وكيل معتمداً"
      />

      <Card>
        <CardContent className="grid gap-3">
          {applications.length === 0 ? (
            <EmptyState message="لا توجد طلبات انضمام" />
          ) : (
            applications.map((application) => (
              <div
                key={application.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-4"
              >
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{application.name}</span>
                    <Badge
                      variant={
                        application.status === "NEW"
                          ? "default"
                          : application.status === "APPROVED"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {labelOf("applicationStatus", application.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span dir="ltr">{application.phone}</span> •{" "}
                    <span dir="ltr">{application.email}</span>
                    {application.city && ` • ${application.city}`}
                    {application.companyName && ` • ${application.companyName}`}
                  </p>
                  {application.message && (
                    <p className="text-sm">{application.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(application.createdAt)}
                  </p>
                </div>
                {application.status === "NEW" && (
                  <div className="flex items-center gap-2">
                    <FormDialog
                      title={`قبول ${application.name} كوكيل`}
                      action={createAgent}
                      trigger={<Button size="sm">{ar.actions.approve}</Button>}
                    >
                      <input
                        type="hidden"
                        name="applicationId"
                        value={application.id}
                      />
                      <input type="hidden" name="name" value={application.name} />
                      <input type="hidden" name="email" value={application.email} />
                      <input type="hidden" name="phone" value={application.phone} />
                      <input
                        type="hidden"
                        name="companyName"
                        value={application.companyName ?? ""}
                      />
                      <input
                        type="hidden"
                        name="city"
                        value={application.city ?? ""}
                      />
                      <Field
                        label={ar.fields.password}
                        name="password"
                        hint="كلمة مرور مؤقتة تُسلم للوكيل"
                      >
                        <Input name="password" dir="ltr" required />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label={ar.fields.commissionRate} name="commissionRate">
                          <Input
                            name="commissionRate"
                            type="number"
                            step="0.5"
                            defaultValue={10}
                          />
                        </Field>
                        <Field
                          label={ar.fields.platformFeeRate}
                          name="platformFeeRate"
                        >
                          <Input
                            name="platformFeeRate"
                            type="number"
                            step="0.5"
                            defaultValue={5}
                          />
                        </Field>
                      </div>
                    </FormDialog>
                    <ActionButton
                      action={setApplicationStatus.bind(
                        null,
                        application.id,
                        "REJECTED",
                      )}
                      size="sm"
                      variant="outline"
                    >
                      {ar.actions.reject}
                    </ActionButton>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
