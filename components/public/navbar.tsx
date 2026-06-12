"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, UserIcon } from "lucide-react";
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
            "rounded-md px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "text-primary"
              : "text-foreground/70 hover:text-foreground",
          )}
        >
          {link.label}
        </Link>
      );
    });

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="text-2xl font-extrabold text-primary">
          {ar.brand}
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">{navLinks()}</nav>

        <div className="flex items-center gap-2">
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
                <SheetTitle className="text-start text-primary">{ar.brand}</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-1 px-4">
                {navLinks(() => setOpen(false))}
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-md border px-3 py-2 text-center text-sm font-medium"
                >
                  {ar.nav.login}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
