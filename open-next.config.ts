import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Fully dynamic app (force-dynamic root layout): no ISR/SSG/data-cache, so
// no R2/DO/D1 cache components are needed. The dummy defaults make every
// revalidatePath() a harmless no-op, which is semantically correct here.
export default defineCloudflareConfig();
