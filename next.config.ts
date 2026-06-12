import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // All images are local files under /public; skipping the optimizer avoids
  // a native sharp dependency in constrained environments.
  images: { unoptimized: true },
  // Required by OpenNext for Prisma: ship the generated client (and its
  // workerd export condition) un-bundled so OpenNext can patch it.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // pg-cloudflare's "workerd" export targets aren't traced under Node
  // conditions (only dist/empty.js is) — force the whole package into the
  // standalone output so the OpenNext worker bundle can resolve it.
  outputFileTracingIncludes: {
    "/**": ["node_modules/pg-cloudflare/**/*"],
  },
};

export default nextConfig;

// Emulates Cloudflare bindings (incl. HYPERDRIVE.localConnectionString)
// during `next dev`, so getCloudflareContext() works locally too.
// MUST stay gated: the library's own guard doesn't check the phase, so an
// unconditional call spawns workerd during `next start` on regular Node
// hosts (e.g. Render) and hijacks the DB URL with localConnectionString.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
