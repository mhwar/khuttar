import type { Metadata } from "next";
import { MailIcon, MapPinIcon, MessageCircleIcon, PhoneIcon } from "lucide-react";
import { submitContactMessage } from "@/lib/actions/misc";
import { getSettings } from "@/lib/queries";
import { ar } from "@/lib/i18n/ar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { ActionForm } from "@/components/shared/action-form";
import { SubmitButton } from "@/components/shared/submit-button";

export const metadata: Metadata = {
  title: ar.nav.contact,
  description: "تواصل مع فريق خطار لتصميم برنامجك أو الاستفسار عن خدماتنا.",
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
      <div className="grid content-start gap-6">
        <h1 className="text-3xl font-extrabold">{ar.nav.contact}</h1>
        <p className="leading-relaxed text-muted-foreground">
          فريقنا جاهز للإجابة عن استفساراتك وتصميم برنامج يناسبك — سياحة أو
          دراسة.
        </p>
        <div className="grid gap-3 text-sm">
          {settings.phone && (
            <p className="flex items-center gap-3">
              <PhoneIcon className="size-5 text-primary" />
              <span dir="ltr">{settings.phone}</span>
            </p>
          )}
          {settings.email && (
            <p className="flex items-center gap-3">
              <MailIcon className="size-5 text-primary" />
              <span dir="ltr">{settings.email}</span>
            </p>
          )}
          {settings.address && (
            <p className="flex items-center gap-3">
              <MapPinIcon className="size-5 text-primary" />
              {settings.address}
            </p>
          )}
        </div>
        {settings.whatsapp && (
          <Button asChild className="w-fit bg-emerald-600 hover:bg-emerald-700">
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircleIcon className="size-4" />
              تواصل عبر واتساب
            </a>
          </Button>
        )}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>أرسل رسالة</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={submitContactMessage}
            successMessage={ar.misc.sentSuccessfully}
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={ar.fields.fullName} name="name">
                <Input name="name" required />
              </Field>
              <Field label={ar.fields.phone} name="phone">
                <Input name="phone" dir="ltr" required />
              </Field>
            </div>
            <Field label={`${ar.fields.email} (${ar.misc.optional})`} name="email">
              <Input name="email" type="email" dir="ltr" />
            </Field>
            <Field label={`${ar.fields.subject} (${ar.misc.optional})`} name="subject">
              <Input name="subject" />
            </Field>
            <Field label={ar.fields.message} name="message">
              <Textarea name="message" rows={4} required />
            </Field>
            <SubmitButton className="w-full">{ar.actions.send}</SubmitButton>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
