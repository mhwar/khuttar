import Link from "next/link";
import {
  CompassIcon,
  MailIcon,
  MapPinIcon,
  MessageCircleIcon,
  PhoneIcon,
} from "lucide-react";
import { getSettings } from "@/lib/queries";
import { ar } from "@/lib/i18n/ar";

export async function Footer() {
  const settings = await getSettings();

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid content-start gap-3">
          <p className="inline-flex items-center gap-1.5 text-3xl font-black">
            <CompassIcon className="size-6 text-gold" />
            {ar.brand}
          </p>
          <p className="text-sm leading-relaxed text-background/65">
            {settings.heroSubtitle ?? "منصة سعودية للسياحة والسفر وبرامج الدراسة بالخارج"}
          </p>
          <div className="mt-1 flex items-center gap-2">
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                aria-label="الهاتف"
                className="flex size-9 items-center justify-center rounded-full bg-background/10 transition-colors hover:bg-background/20"
              >
                <PhoneIcon className="size-4" />
              </a>
            )}
            {settings.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="واتساب"
                className="flex size-9 items-center justify-center rounded-full bg-background/10 transition-colors hover:bg-background/20"
              >
                <MessageCircleIcon className="size-4" />
              </a>
            )}
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 items-center rounded-full bg-background/10 px-3 text-xs font-medium transition-colors hover:bg-background/20"
              >
                Instagram
              </a>
            )}
            {settings.x && (
              <a
                href={`https://x.com/${settings.x}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 items-center rounded-full bg-background/10 px-3 text-xs font-medium transition-colors hover:bg-background/20"
              >
                X
              </a>
            )}
          </div>
        </div>

        <div className="grid content-start gap-3 text-sm">
          <p className="font-bold">{ar.footer.quickLinks}</p>
          <Link href="/destinations" className="text-background/65 transition-colors hover:text-background">
            {ar.nav.destinations}
          </Link>
          <Link href="/programs" className="text-background/65 transition-colors hover:text-background">
            {ar.nav.programs}
          </Link>
          <Link href="/study" className="text-background/65 transition-colors hover:text-background">
            {ar.nav.study}
          </Link>
          <Link href="/contact" className="text-background/65 transition-colors hover:text-background">
            {ar.nav.contact}
          </Link>
        </div>

        <div className="grid content-start gap-3 text-sm">
          <p className="font-bold">{ar.footer.forPartners}</p>
          <Link href="/agents" className="text-background/65 transition-colors hover:text-background">
            {ar.nav.agents}
          </Link>
          <Link href="/login" className="text-background/65 transition-colors hover:text-background">
            {ar.nav.login}
          </Link>
        </div>

        <div className="grid content-start gap-3 text-sm">
          <p className="font-bold">{ar.footer.contactUs}</p>
          {settings.phone && (
            <a
              href={`tel:${settings.phone}`}
              className="flex items-center gap-2 text-background/65 transition-colors hover:text-background"
            >
              <PhoneIcon className="size-4 shrink-0" />
              <span dir="ltr">{settings.phone}</span>
            </a>
          )}
          {settings.email && (
            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-2 text-background/65 transition-colors hover:text-background"
            >
              <MailIcon className="size-4 shrink-0" />
              <span dir="ltr">{settings.email}</span>
            </a>
          )}
          {settings.address && (
            <p className="flex items-center gap-2 text-background/65">
              <MapPinIcon className="size-4 shrink-0" />
              {settings.address}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-background/10 py-4 text-center text-xs text-background/45">
        © {new Date().getFullYear()} {ar.brandFull} — {ar.footer.rights}
      </div>
    </footer>
  );
}
