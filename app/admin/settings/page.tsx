import { requireAdmin } from "@/lib/auth";
import { saveSettings } from "@/lib/actions/misc";
import { getSettings } from "@/lib/queries";
import { ar } from "@/lib/i18n/ar";
import { PageHeader } from "@/components/shared/page-header";
import { Field } from "@/components/shared/field";
import { ActionForm } from "@/components/shared/action-form";
import { SubmitButton } from "@/components/shared/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        title={ar.admin.settings}
        description="نصوص الصفحة الرئيسية وبيانات التواصل الظاهرة في الموقع"
      />

      <ActionForm action={saveSettings}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>الصفحة الرئيسية</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Field label="عنوان الهيرو" htmlFor="heroTitle">
                <Input
                  id="heroTitle"
                  name="heroTitle"
                  defaultValue={settings.heroTitle ?? ""}
                  placeholder={ar.tagline}
                />
              </Field>
              <Field label="النص التعريفي" htmlFor="heroSubtitle">
                <Input
                  id="heroSubtitle"
                  name="heroSubtitle"
                  defaultValue={settings.heroSubtitle ?? ""}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>بيانات التواصل</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label={ar.fields.phone} htmlFor="phone">
                <Input id="phone" name="phone" dir="ltr" defaultValue={settings.phone ?? ""} />
              </Field>
              <Field label="واتساب (رقم دولي)" htmlFor="whatsapp">
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  dir="ltr"
                  placeholder="9665xxxxxxxx"
                  defaultValue={settings.whatsapp ?? ""}
                />
              </Field>
              <Field label={ar.fields.email} htmlFor="email">
                <Input id="email" name="email" dir="ltr" defaultValue={settings.email ?? ""} />
              </Field>
              <Field label="العنوان" htmlFor="address">
                <Input id="address" name="address" defaultValue={settings.address ?? ""} />
              </Field>
              <Field label="إنستغرام" htmlFor="instagram">
                <Input
                  id="instagram"
                  name="instagram"
                  dir="ltr"
                  defaultValue={settings.instagram ?? ""}
                />
              </Field>
              <Field label="منصة X" htmlFor="x">
                <Input id="x" name="x" dir="ltr" defaultValue={settings.x ?? ""} />
              </Field>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <SubmitButton>{ar.actions.save}</SubmitButton>
          </div>
        </div>
      </ActionForm>
    </>
  );
}
