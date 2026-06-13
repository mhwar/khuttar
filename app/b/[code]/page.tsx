import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BusIcon,
  CalendarDaysIcon,
  MessageCircleIcon,
  PhoneIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/queries";
import { labelOf } from "@/lib/constants";
import { formatDate, formatSAR } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/shared/misc";
import { ItineraryView } from "@/components/public/itinerary-view";
import { MilestonesView } from "@/components/public/milestones-view";
import { TripMessages } from "@/components/public/trip-messages";

// "05xxxxxxxx" → "9665xxxxxxxx" for wa.me; passes through already-formatted numbers.
function toWa(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `966${digits.slice(1)}`;
  return digits;
}

export const metadata: Metadata = {
  title: "تفاصيل رحلتك",
  robots: { index: false, follow: false },
};

// Price and payments become visible to the customer once the booking has
// been priced (QUOTED and beyond).
const PRICED_STATUSES = ["QUOTED", "CONFIRMED", "COMPLETED"];

export default async function TripPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  const [booking, settings] = await Promise.all([
    db.bookingRequest.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        program: {
          include: {
            days: {
              orderBy: { dayNumber: "asc" },
              include: {
                items: {
                  orderBy: { sortOrder: "asc" },
                  include: { area: { select: { name: true } } },
                },
              },
            },
          },
        },
        payments: { orderBy: { paidAt: "asc" } },
        transfers: {
          orderBy: { date: "asc" },
          include: { driver: { select: { name: true, phone: true } } },
        },
        messages: { orderBy: { createdAt: "asc" } },
        milestones: { orderBy: { sortOrder: "asc" } },
        agent: { include: { user: { select: { name: true } } } },
        managerAgent: { include: { user: { select: { name: true } } } },
      },
    }),
    getSettings(),
  ]);
  if (!booking) notFound();

  const firstName = booking.customerName.split(" ")[0];
  const showPrice =
    booking.totalPrice && PRICED_STATUSES.includes(booking.status);
  const paid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
  const days =
    booking.program?.days.map((day) => ({
      ...day,
      items: day.items.map((item) => ({ ...item, areaName: item.area?.name })),
    })) ?? [];
  const visibleTransfers = booking.transfers.filter(
    (t) => t.status !== "CANCELLED",
  );
  // The agent managing this booking (manager first, else the referral agent)
  // becomes the customer's point of contact; otherwise the platform.
  const responsible = booking.managerAgent ?? booking.agent;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-gradient-to-bl from-primary to-teal-800 text-primary-foreground">
        <div className="mx-auto grid max-w-3xl gap-3 px-4 py-10 text-center">
          <Link href="/" className="text-2xl font-extrabold">
            {ar.brand}
          </Link>
          <h1 className="text-2xl font-bold">
            {ar.trip.greeting} {firstName} 👋
          </h1>
          <p className="text-primary-foreground/85">
            {booking.programTitle ?? ar.trip.yourTrip}
          </p>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-sm" dir="ltr">
              {booking.code}
            </span>
            <BookingStatusBadge status={booking.status} />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
        <Card>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDaysIcon className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {ar.fields.preferredDate}
                </p>
                <p className="font-medium">{formatDate(booking.preferredDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <UsersIcon className="size-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {ar.fields.travelers}
                </p>
                <p className="font-medium">
                  {booking.adults} بالغ
                  {booking.children ? ` + ${booking.children} طفل` : ""}
                </p>
              </div>
            </div>
            {showPrice ? (
              <div className="flex items-center gap-2 text-sm">
                <WalletIcon className="size-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {ar.fields.totalPrice}
                  </p>
                  <p className="font-medium">{formatSAR(booking.totalPrice)}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {showPrice && booking.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{ar.booking.payments}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              {booking.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {formatDate(payment.paidAt)} •{" "}
                    {labelOf("paymentMethod", payment.method)}
                  </span>
                  <span className="font-medium">{formatSAR(payment.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>{ar.booking.paid}</span>
                <span>{formatSAR(paid)}</span>
              </div>
              {booking.totalPrice && paid < booking.totalPrice && (
                <div className="flex justify-between text-amber-700">
                  <span>{ar.booking.remaining}</span>
                  <span>{formatSAR(booking.totalPrice - paid)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {visibleTransfers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BusIcon className="size-4" />
                {ar.booking.transfersTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {visibleTransfers.map((transfer) => (
                <div key={transfer.id} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {transfer.fromLocation} ← {transfer.toLocation}
                    </span>
                    <Badge variant="secondary">
                      {labelOf("transferStatus", transfer.status)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(transfer.date)}
                    {transfer.time && <span dir="ltr"> • {transfer.time}</span>}
                  </p>
                  {transfer.driver && transfer.status === "ASSIGNED" && (
                    <p className="mt-1 flex items-center gap-1 text-xs">
                      <PhoneIcon className="size-3" />
                      {ar.fields.driver}: {transfer.driver.name}{" "}
                      <a
                        href={`tel:${transfer.driver.phone}`}
                        dir="ltr"
                        className="text-primary hover:underline"
                      >
                        {transfer.driver.phone}
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {days.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{ar.trip.itinerary}</CardTitle>
            </CardHeader>
            <CardContent>
              <ItineraryView days={days} />
            </CardContent>
          </Card>
        )}

        {booking.milestones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{ar.trip.progress}</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestonesView milestones={booking.milestones} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar.booking.messages}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {ar.booking.messagesHint}
            </p>
          </CardHeader>
          <CardContent>
            <TripMessages
              code={booking.code}
              messages={booking.messages.map((m) => ({
                id: m.id,
                authorRole: m.authorRole,
                authorName: m.authorName,
                body: m.body,
                createdAt: m.createdAt.toISOString(),
              }))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-3 text-center">
            <p className="font-bold">{ar.trip.yourContact}</p>
            <p className="text-sm text-muted-foreground">
              {ar.trip.yourContactHint}
            </p>
            {responsible ? (
              <>
                <p className="text-sm font-medium">
                  {responsible.user.name}
                  {responsible.companyName ? ` — ${responsible.companyName}` : ""}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <a
                      href={`https://wa.me/${toWa(responsible.phone)}?text=${encodeURIComponent(`استفسار عن الحجز ${booking.code}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircleIcon className="size-4" />
                      واتساب
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${responsible.phone}`}>
                      <PhoneIcon className="size-4" />
                      <span dir="ltr">{responsible.phone}</span>
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2">
                {settings.whatsapp && (
                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <a
                      href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`استفسار عن الحجز ${booking.code}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircleIcon className="size-4" />
                      واتساب
                    </a>
                  </Button>
                )}
                {settings.phone && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${settings.phone}`}>
                      <PhoneIcon className="size-4" />
                      <span dir="ltr">{settings.phone}</span>
                    </a>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
