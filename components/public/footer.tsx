import Link from "next/link";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { getSettings } from "@/lib/queries";
import { ar } from "@/lib/i18n/ar";

export async function Footer() {
  const settings = await getSettings();

  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-2">
          <p className="text-2xl font-extrabold text-primary">{ar.brand}</p>
          <p className="text-sm text-muted-foreground">
            {settings.heroSubtitle ??
              "منصة سعودية للسياحة والسفر وبرامج الدراسة بالخارج"}
          </p>
        </div>

        <div className="grid content-start gap-2 text-sm">
          <p className="font-bold">روابط سريعة</p>
          <Link href="/destinations" className="text-muted-foreground hover:text-foreground">
            {ar.nav.destinations}
          </Link>
          <Link href="/programs" className="text-muted-foreground hover:text-foreground">
            {ar.nav.programs}
          </Link>
          <Link href="/study" className="text-muted-foreground hover:text-foreground">
            {ar.nav.study}
          </Link>
        </div>

        <div className="grid content-start gap-2 text-sm">
          <p className="font-bold">للشركاء</p>
          <Link href="/agents" className="text-muted-foreground hover:text-foreground">
            {ar.nav.agents}
          </Link>
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            {ar.nav.login}
          </Link>
        </div>

        <div className="grid content-start gap-2 text-sm">
          <p className="font-bold">{ar.nav.contact}</p>
          {settings.phone && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <PhoneIcon className="size-4" />
              <span dir="ltr">{settings.phone}</span>
            </p>
          )}
          {settings.email && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MailIcon className="size-4" />
              <span dir="ltr">{settings.email}</span>
            </p>
          )}
          {settings.address && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <MapPinIcon className="size-4" />
              {settings.address}
            </p>
          )}
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {ar.brandFull} — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
