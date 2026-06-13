"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompassIcon, MenuIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ar } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: ar.nav.home },
  { href: "/destinations", label: ar.nav.destinations },
  { href: "/programs", label: ar.nav.programs },
  { href: "/study", label: ar.nav.study },
  { href: "/agents", label: ar.nav.agents },
  { href: "/contact", label: ar.nav.contact },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = (onClick?: () => void) =>
    links.map((link) => {
      const active =
        link.href === "/"
          ? pathname === "/"
          : pathname.startsWith(link.href);
      return (
        <Link
          key={link.href}
          href={link.href}
          onClick={onClick}
          className={cn(
            "relative rounded-md px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "text-primary after:absolute after:bottom-0 after:start-3 after:end-3 after:h-0.5 after:rounded-full after:bg-primary"
              : "text-foreground/70 hover:text-foreground",
          )}
        >
          {link.label}
        </Link>
      );
    });

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/92 backdrop-blur transition-shadow duration-200",
        scrolled ? "shadow-sm" : "shadow-none",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-2xl font-extrabold text-primary">
          <CompassIcon className="size-5 text-gold" />
          {ar.brand}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">{navLinks()}</nav>

        <div className="flex items-center gap-2">
          <Button size="sm" asChild className="hidden lg:inline-flex">
            <Link href="/programs">{ar.nav.bookNowCta}</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="hidden lg:inline-flex">
            <Link href="/login">
              <UserIcon className="size-4" />
              {ar.nav.login}
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" className="lg:hidden" aria-label="القائمة">
                <MenuIcon className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="inline-flex items-center gap-1.5 text-start text-primary">
                  <CompassIcon className="size-4 text-gold" />
                  {ar.brand}
                </SheetTitle>
              </SheetHeader>
              <nav className="grid gap-1 px-4">
                {navLinks(() => setOpen(false))}
                <div className="mt-3 grid gap-2 border-t pt-3">
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link href="/programs">{ar.nav.bookNowCta}</Link>
                  </Button>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors hover:bg-muted"
                  >
                    {ar.nav.login}
                  </Link>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
