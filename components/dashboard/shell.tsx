"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BusIcon,
  CarIcon,
  HandshakeIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MailIcon,
  MapIcon,
  MapPinIcon,
  MenuIcon,
  NotebookTextIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UserCheckIcon,
  UserIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ar } from "@/lib/i18n/ar";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

// Nav configs live here (client side) because component references cannot
// cross the server → client boundary as props.
const NAV_ITEMS: Record<"admin" | "agent", NavItem[]> = {
  admin: [
    { href: "/admin", label: ar.admin.overview, icon: LayoutDashboardIcon, exact: true },
    { href: "/admin/bookings", label: ar.admin.bookings, icon: NotebookTextIcon },
    { href: "/admin/programs", label: ar.admin.programs, icon: MapIcon },
    { href: "/admin/destinations", label: ar.admin.destinations, icon: MapPinIcon },
    { href: "/admin/transfers", label: ar.admin.transfers, icon: BusIcon },
    { href: "/admin/drivers", label: ar.admin.drivers, icon: CarIcon },
    { href: "/admin/providers", label: ar.admin.providers, icon: HandshakeIcon },
    { href: "/admin/agents", label: ar.admin.agents, icon: UserCheckIcon },
    { href: "/admin/applications", label: ar.admin.applications, icon: InboxIcon },
    { href: "/admin/messages", label: ar.admin.messages, icon: MailIcon },
    { href: "/admin/users", label: ar.admin.users, icon: UsersIcon },
    { href: "/admin/settings", label: ar.admin.settings, icon: SettingsIcon },
  ],
  agent: [
    { href: "/agent", label: ar.agent.overview, icon: LayoutDashboardIcon, exact: true },
    { href: "/agent/bookings", label: ar.agent.myBookings, icon: NotebookTextIcon },
    { href: "/agent/programs", label: ar.agent.myPrograms, icon: MapIcon },
    { href: "/agent/statement", label: ar.agent.statement, icon: ReceiptTextIcon },
    { href: "/agent/profile", label: ar.agent.profile, icon: UserIcon },
  ],
};

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="grid gap-1 p-2">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Two-pane dashboard shell: fixed sidebar on desktop (right side in RTL),
// sheet drawer on mobile. Used by both /admin and /agent layouts.
export function DashboardShell({
  variant,
  title,
  userName,
  logoutAction,
  children,
}: {
  variant: "admin" | "agent";
  title: string;
  userName: string;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const items = NAV_ITEMS[variant];

  const sidebarInner = (
    <>
      <div className="flex items-center gap-2 p-4">
        <Link href="/" className="text-2xl font-extrabold text-primary">
          {ar.brand}
        </Link>
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto">
        <NavLinks items={items} onNavigate={() => setOpen(false)} />
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-2 p-3">
        <span className="truncate text-sm font-medium">{userName}</span>
        <form action={logoutAction}>
          <Button
            variant="ghost"
            size="icon-sm"
            type="submit"
            aria-label={ar.actions.logout}
          >
            <LogOutIcon className="size-4" />
          </Button>
        </form>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e bg-sidebar lg:flex">
        {sidebarInner}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background px-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="القائمة">
                <MenuIcon className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-72 flex-col p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{title}</SheetTitle>
              </SheetHeader>
              {sidebarInner}
            </SheetContent>
          </Sheet>
          <span className="font-bold text-primary">{ar.brand}</span>
          <span className="text-sm text-muted-foreground">{title}</span>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto grid w-full max-w-6xl gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
