// Geographic matching for dispatch (drivers / providers ↔ transfers).
//
// Service areas live on the existing Destination → Area tree (REGION → CITY →
// DISTRICT). A driver pinned to a REGION implicitly covers every city/district
// under it, so matching walks the parent chain in both directions:
//   - a transfer in a CITY matches a driver pinned to that city or an ancestor
//     REGION (the driver covers the whole region), and
//   - a transfer in a whole REGION matches a driver pinned to one of its cities.
//
// Plain module (no "use server") so it can be imported by server components.

export type AreaParentMap = Record<string, string | null>;

// Ancestor-or-self ids, walking up the parent chain (cycle-safe).
export function ancestorIds(
  areaId: string,
  parents: AreaParentMap,
): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  let cur: string | null | undefined = areaId;
  while (cur && !seen.has(cur)) {
    chain.push(cur);
    seen.add(cur);
    cur = parents[cur];
  }
  return chain;
}

// Does a service pinned to `serviceAreaId` cover a transfer in `transferAreaId`?
export function areaMatches(
  serviceAreaId: string | null | undefined,
  transferAreaId: string | null | undefined,
  parents: AreaParentMap,
): boolean {
  if (!serviceAreaId || !transferAreaId) return false;
  if (serviceAreaId === transferAreaId) return true;
  return (
    ancestorIds(transferAreaId, parents).includes(serviceAreaId) ||
    ancestorIds(serviceAreaId, parents).includes(transferAreaId)
  );
}

// Split a list of services into those that cover the transfer's area and the
// rest, preserving the original order within each group.
export function partitionByArea<T extends { areaId: string | null }>(
  list: T[],
  transferAreaId: string | null | undefined,
  parents: AreaParentMap,
): { suggested: T[]; others: T[] } {
  if (!transferAreaId) return { suggested: [], others: list };
  const suggested: T[] = [];
  const others: T[] = [];
  for (const item of list) {
    if (areaMatches(item.areaId, transferAreaId, parents)) suggested.push(item);
    else others.push(item);
  }
  return { suggested, others };
}
