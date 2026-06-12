import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ar } from "@/lib/i18n/ar";
import { DestinationCard } from "@/components/public/cards";
import { EmptyState } from "@/components/shared/misc";

export const metadata: Metadata = {
  title: ar.nav.destinations,
  description:
    "وجهات خطار السياحية والدراسية: داخل السعودية وحول العالم — مدن ومعالم وبرامج جاهزة.",
};

export default async function DestinationsPage() {
  const destinations = await db.destination.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12">
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-extrabold">{ar.nav.destinations}</h1>
        <p className="text-muted-foreground">
          اختر وجهتك — ولكل وجهة مدنها ومعالمها وبرامجها الجاهزة
        </p>
      </div>

      {destinations.length === 0 ? (
        <EmptyState message="سيتم إضافة الوجهات قريباً" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>
      )}
    </div>
  );
}
