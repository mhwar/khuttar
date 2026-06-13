import "server-only";
import { db } from "@/lib/db";
import type { AreaOption } from "@/components/shared/area-select";
import type { AreaParentMap } from "@/lib/area-tree";

export type AreaData = {
  // Flat, destination-grouped list for <AreaSelect>.
  options: AreaOption[];
  // areaId → parentId, for ancestor matching in lib/area-tree.ts.
  parents: AreaParentMap;
};

// Loads every area once, ordered so same-destination areas stay contiguous.
export async function loadAreaData(): Promise<AreaData> {
  const areas = await db.area.findMany({
    include: { destination: { select: { name: true, sortOrder: true } } },
    orderBy: [{ destination: { sortOrder: "asc" } }, { sortOrder: "asc" }],
  });

  const options: AreaOption[] = areas.map((a) => ({
    id: a.id,
    name: a.name,
    parentId: a.parentId,
    destinationName: a.destination.name,
  }));
  const parents: AreaParentMap = Object.fromEntries(
    areas.map((a) => [a.id, a.parentId]),
  );

  return { options, parents };
}
