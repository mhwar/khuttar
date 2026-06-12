// Production seed: idempotent, no demo data. Creates the first admin from
// env vars and the default site settings only. Safe to re-run — it never
// overwrites an existing admin password or settings edited via /admin.
//
// Usage (CI or locally against the DIRECT database URL, never Hyperdrive):
//   DATABASE_URL=... SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... \
//     pnpm db:seed:prod

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../lib/password";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url }),
});

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    throw new Error(
      "SEED_ADMIN_EMAIL و SEED_ADMIN_PASSWORD (8 أحرف فأكثر) مطلوبان",
    );
  }

  const admin = await db.user.upsert({
    where: { email },
    // Empty update: never touch an existing admin's password.
    update: {},
    create: {
      email,
      name: "إدارة خطار",
      passwordHash: await hashPassword(password),
      role: "ADMIN",
    },
  });

  await db.siteSetting.createMany({
    data: [
      { key: "heroTitle", value: "خطّط رحلتك القادمة مع خطار" },
      {
        key: "heroSubtitle",
        value:
          "برامج سياحية داخلية وخارجية بجداول مفصلة، وبرامج لغة وابتعاث بخبرة حقيقية في القبولات.",
      },
      { key: "phone", value: "+966 55 000 0000" },
      { key: "whatsapp", value: "966550000000" },
      { key: "email", value: email },
      { key: "address", value: "" },
      { key: "instagram", value: "" },
      { key: "x", value: "" },
    ],
    // Settings already edited from /admin/settings are preserved.
    skipDuplicates: true,
  });

  console.log(`✅ جاهز: حساب الإدارة ${admin.email} وإعدادات الموقع الافتراضية`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
