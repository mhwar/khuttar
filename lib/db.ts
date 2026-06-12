import { cache } from "react";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

function connectionString(): string {
  // An explicit DATABASE_URL always wins: Node hosts (e.g. Render) inject it,
  // and local dev/scripts read it from .env. The Hyperdrive binding is the
  // source of truth only on Cloudflare Workers, where DATABASE_URL is unset —
  // never let an emulated binding's localConnectionString shadow a real URL.
  const url = process.env.DATABASE_URL;
  if (url) return url;
  try {
    const { env } = getCloudflareContext();
    const cs = (env as { HYPERDRIVE?: { connectionString: string } })
      .HYPERDRIVE?.connectionString;
    if (cs) return cs;
  } catch {
    // Not in a Workers context — fall through to the error below.
  }
  throw new Error("Set DATABASE_URL or bind HYPERDRIVE");
}

// One client per request via react cache(). A pg connection must never be
// shared across workerd request contexts ("Cannot perform I/O on behalf of
// a different request"); Hyperdrive holds the real pool, so per-request
// clients with maxUses: 1 are the documented-safe pattern and stay cheap.
const getDb = cache(
  () =>
    new PrismaClient({
      adapter: new PrismaPg({
        connectionString: connectionString(),
        max: 5,
        maxUses: 1,
      }),
    }),
);

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getDb() as unknown as Record<PropertyKey, unknown>;
    const value = client[prop as keyof typeof client];
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});
