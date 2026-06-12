import type { Metadata } from "next";
import {
  CalendarRangeIcon,
  LineChartIcon,
  WalletIcon,
} from "lucide-react";
import { submitAgentApplication } from "@/lib/actions/agents";
import { ar } from "@/lib/i18n/ar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/field";
import { ActionForm } from "@/components/shared/action-form";
import { SubmitButton } from "@/components/shared/submit-button";

export const metadata: Metadata = {
  title: ar.nav.agents,
  description:
    "انضم لشبكة وكلاء خطار: ابنِ برامجك، شاركها بكود إحالة خاص، وتابع عمولاتك من لوحة تحكمك.",
};

export default function AgentsPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-2">
      <div className="grid content-start gap-6">
        <h1 className="text-3xl font-extrabold">{ar.misc.becomeAgent}</h1>
        <p className="leading-relaxed text-muted-foreground">
          {ar.misc.becomeAgentBody}
        </p>
        <div className="grid gap-4">
          {[
            {
              icon: CalendarRangeIcon,
              title: "أدوات بناء الجداول",
              body: "ابنِ برامج سياحية احترافية يوماً بيوم من مكتبة الوجهات والمعالم الجاهزة.",
            },
            {
              icon: LineChartIcon,
              title: "كود إحالة خاص",
              body: "كل طلب حجز يصل عبر رابطك يُنسب لك تلقائياً وتتابعه من لوحتك.",
            },
            {
              icon: WalletIcon,
              title: "عمولات شفافة",
              body: "كشف حساب واضح: عمولاتك ورسوم المنصة ودفعاتك في مكان واحد.",
            },
          ].map((feature) => (
            <div key={feature.title} className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <div>
                <p className="font-bold">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>قدّم طلب الانضمام</CardTitle>
          <p className="text-sm text-muted-foreground">
            سيتواصل معك فريقنا بعد مراجعة الطلب لتفعيل حسابك
          </p>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={submitAgentApplication}
            successMessage="تم استلام طلبك — سنتواصل معك قريباً"
            className="grid gap-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={ar.fields.fullName} name="name">
                <Input name="name" required />
              </Field>
              <Field label={ar.fields.phone} name="phone">
                <Input name="phone" dir="ltr" placeholder="05xxxxxxxx" required />
              </Field>
            </div>
            <Field label={ar.fields.email} name="email">
              <Input name="email" type="email" dir="ltr" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={`${ar.fields.companyName} (${ar.misc.optional})`} name="companyName">
                <Input name="companyName" />
              </Field>
              <Field label={`${ar.fields.city} (${ar.misc.optional})`} name="city">
                <Input name="city" />
              </Field>
            </div>
            <Field label={`نبذة عن خبرتك (${ar.misc.optional})`} name="message">
              <Textarea name="message" rows={3} />
            </Field>
            <SubmitButton className="w-full">{ar.actions.apply}</SubmitButton>
          </ActionForm>
        </CardContent>
      </Card>
    </div>
  );
}
