// Renders the production wrangler.jsonc from wrangler.template.jsonc by
// substituting ${HYPERDRIVE_ID} and ${NEXT_PUBLIC_APP_URL} from the
// environment. Run by CI before the OpenNext build/deploy so the Hyperdrive
// id and public URL never need to be committed. Local dev keeps its own
// committed wrangler.jsonc (placeholder id + localConnectionString) untouched.
import { readFileSync, writeFileSync } from "node:fs";

const REQUIRED = ["HYPERDRIVE_ID", "NEXT_PUBLIC_APP_URL"];
const missing = REQUIRED.filter((key) => !process.env[key]?.trim());
if (missing.length) {
  console.error(
    `render-wrangler: missing required env var(s): ${missing.join(", ")}.\n` +
      "Set the GitHub Actions variables HYPERDRIVE_ID and NEXT_PUBLIC_APP_URL " +
      "(see README → النشر على Cloudflare).",
  );
  process.exit(1);
}

let out = readFileSync("wrangler.template.jsonc", "utf8");
for (const key of REQUIRED) {
  out = out.replaceAll(`\${${key}}`, process.env[key].trim());
}
writeFileSync("wrangler.jsonc", out);
console.log("render-wrangler: wrote production wrangler.jsonc");
