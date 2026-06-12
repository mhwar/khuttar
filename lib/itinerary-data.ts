import "server-only";
import { db } from "@/lib/db";

// Loads a program with its full itinerary plus the area/attraction pick-lists
// the builder needs. Shared by the admin and agent itinerary pages.
export async function loadBuilderData(programId: string) {
  const [program, areas, attractions] = await Promise.all([
    db.program.findUnique({
      where: { id: programId },
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
    }),
    db.area.findMany({
      include: { destination: { select: { name: true } } },
      orderBy: [{ destinationId: "asc" }, { sortOrder: "asc" }],
    }),
    db.attraction.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, areaId: true, durationMin: true },
    }),
  ]);
  if (!program) return null;

  return {
    program,
    days: program.days.map((day) => ({
      id: day.id,
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description,
      items: day.items.map((item) => ({
        id: item.id,
        dayId: item.dayId,
        type: item.type,
        title: item.title,
        notes: item.notes,
        startTime: item.startTime,
        durationMin: item.durationMin,
        areaId: item.areaId,
        attractionId: item.attractionId,
        areaName: item.area?.name ?? null,
      })),
    })),
    areas: areas.map((area) => ({
      id: area.id,
      name: area.name,
      destinationName: area.destination.name,
    })),
    attractions,
  };
}
