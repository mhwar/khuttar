# منصة خطار — Khattar Platform

> 🖼️ **صفحة العرض والمراجعة (لقطات حقيقية من المنصة):** https://mhwar.github.io/khuttar/

منصة متكاملة لشركة **خطار للسياحة والسفر**: برامج سياحية داخلية وخارجية مع أداة بناء جداول الرحلات يوماً بيوم، برامج دراسة اللغة والابتعاث، نظام وكلاء بعمولات وكشوف حساب، وإدارة رحلات العملاء وخدمات النقل بالتنسيق مع السائقين ومزوّدي الخدمات.

## نظرة سريعة

| الجزء | الوصف |
|---|---|
| الموقع العام | `/` الرئيسية، `/destinations` الوجهات، `/programs` البرامج السياحية، `/study` برامج الدراسة، `/agents` انضمام الوكلاء، `/contact` تواصل |
| صفحة رحلة العميل | `/b/[code]` — يتابع العميل جدول رحلته وحالتها ومدفوعاته وسائقه **بدون تسجيل دخول** (الرابط هو المفتاح) |
| لوحة الإدارة | `/admin` — حجوزات، برامج وباني الجداول، وجهات/مناطق/معالم، نقل وسائقون ومزوّدون، وكلاء وكشوف، طلبات انضمام، رسائل، مستخدمون، إعدادات |
| لوحة الوكيل | `/agent` — حجوزاته، برامجه (مع باني الجداول)، كشف حسابه، رابط إحالته الخاص |

## التقنيات

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS v4** + **shadcn/ui** (Radix) — عربي RTL بالكامل، خط Cairo ذاتي الاستضافة
- **Prisma 6** + **PostgreSQL** (متوافق مع SQLite كبديل — بدون enums أصلية أو Json)
- **zod 4** + Server Actions بنمط موحّد (`useActionState`) — بدون مكتبات نماذج/جداول ثقيلة
- مصادقة جلسات خفيفة: PBKDF2 عبر WebCrypto (`lib/password.ts`) + جدول Sessions + كوكي httpOnly — الحماية الفعلية داخل layouts **وكل** server action
- جاهزة للنشر على **Cloudflare Workers** عبر `@opennextjs/cloudflare` + **Hyperdrive** (انظر دليل النشر أدناه)

## التشغيل محلياً

```bash
# 1) قاعدة البيانات (PostgreSQL)
service postgresql start          # أو الطريقة المناسبة لنظامك
su - postgres -c "psql -c \"CREATE ROLE khattar LOGIN PASSWORD 'khattar' CREATEDB;\""
su - postgres -c "createdb -O khattar khattar"

# 2) الإعداد
cp .env.example .env              # عدّل DATABASE_URL إن لزم
pnpm install
pnpm prisma migrate dev           # إنشاء الجداول
pnpm db:seed                      # بيانات تجريبية كاملة (يطبع حسابات الدخول)

# 3) التشغيل
pnpm dev                          # http://localhost:3000
```

> **بديل SQLite**: غيّر في `prisma/schema.prisma` إلى `provider = "sqlite"` و`url = "file:./dev.db"` ثم `pnpm prisma db push` — المخطط متوافق دون أي تعديل آخر.

### حسابات تجريبية (بعد الـ seed)

| الدور | البريد | كلمة المرور |
|---|---|---|
| الإدارة | `admin@khattar.sa` | `Khattar123!` |
| وكيل معتمد | `agent@khattar.sa` | `Khattar123!` — كود الإحالة `AHMED10` |

روابط للتجربة: صفحة رحلة عميل `/b/KH-CNF005` • حجز عبر إحالة `/programs?ref=AHMED10`

## مفاهيم العمل الأساسية

- **آلة حالات الحجز**: `NEW → CONTACTED → QUOTED → CONFIRMED → COMPLETED` (+`CANCELLED`). الوكيل يحرّك حجوزاته حتى `QUOTED`؛ التأكيد والإكمال والإلغاء صلاحية إدارية (لإبقاء الحركة المالية بيد الإدارة). التعريف في `lib/constants.ts`.
- **القيود التلقائية**: عند تأكيد حجز منسوب لوكيل معتمد تُنشأ قيود `COMMISSION +` و`PLATFORM_FEE −` حسب نسب الوكيل، **مرة واحدة فقط** لكل حجز (فحص وجود داخل `$transaction`). الدفعات للوكيل (`PAYOUT`) والتسويات (`ADJUSTMENT`) تُسجل يدوياً. الرصيد = مجموع القيود = ما تدينه المنصة للوكيل.
- **الإحالة**: روابط البرامج تحمل `?ref=CODE`؛ أي طلب حجز عبرها يُنسب للوكيل المعتمد تلقائياً (الأكواد غير الصالحة تُتجاهل بصمت). برامج الوكيل نفسه تُنسب له دائماً.
- **موافقة البرامج**: برامج الوكلاء تظهر للعموم فقط بعد `isApproved` من الإدارة. الظهور: `PUBLIC` في القوائم، `UNLISTED` بالرابط المباشر فقط، `PRIVATE`/مسودة = 404.
- **الوجهات الشجرية**: `Destination → Area` (ذاتية التداخل عبر `parentId` مع نوع التقسيم: منطقة/محافظة/مدينة/حي...) → `Attraction`. باني الجدول يلتقط المعلم فيعبّئ العنوان والمدة تلقائياً.

## ملفات مفصلية

| الملف | الدور |
|---|---|
| `prisma/schema.prisma` | نموذج البيانات كاملاً |
| `lib/constants.ts` | الحالات (pseudo-enums) + انتقالات الحجز + التسميات العربية |
| `lib/format.ts` | تواريخ وعملة — **ملاحظة مهمة**: `ar-SA` وحدها قد تعطي تقويماً هجرياً وأرقاماً شرقية؛ نستخدم `ar-SA-u-ca-gregory-nu-latn` دائماً |
| `lib/auth.ts` | الجلسات و`requireAdmin`/`requireAgent` |
| `lib/actions/bookings.ts` | إنشاء الحجوزات، الانتقالات، القيود التلقائية |
| `components/itinerary/builder.tsx` | باني جداول الرحلات (أيام ← فقرات بأنواعها مع إعادة ترتيب) |
| `components/public/itinerary-view.tsx` | عارض الجدول المشترك (صفحة البرنامج + صفحة رحلة العميل) |
| `lib/i18n/ar.ts` | نصوص الواجهة المركزية (جاهزية لإضافة الإنجليزية لاحقاً) |

## النشر على Cloudflare Workers (الإنتاج)

النشر يتم عبر **GitHub Actions** (`.github/workflows/deploy.yml`) — يعمل على خوادم GitHub التي تصل إلى Cloudflare. كل شيء مُؤتمت؛ كل ما تحتاج توفيره **ثلاثة أشياء**: رابط قاعدة Postgres، مفتاح Cloudflare API، وبيانات حساب الإدارة. الـ CI يتكفّل بإنشاء Hyperdrive وحقن معرّفه والبناء والنشر.

### 1) قاعدة البيانات — Neon (مجاني) أو أي Postgres تملكه
1. console.neon.tech ← New Project ← المنطقة **AWS eu-central-1 (فرانكفورت)** ← اسم القاعدة `khuttar`.
2. من Connection Details **ألغِ تفعيل Connection pooling** وانسخ الرابط المباشر:
   `postgresql://USER:PASSWORD@ep-xxxx.eu-central-1.aws.neon.tech/khuttar?sslmode=require`
   (إن كان لديك Postgres جاهز — استخدم رابطه المباشر بدل Neon.)

### 2) Cloudflare — مفتاح وحساب فقط (لا لمس للوحة)
3. الخطة: **Workers Paid ($5/شهر) موصى بها بقوة** — الحزمة 2.78MiB مضغوطة (قرب حد المجاني 3MiB) وعمليات الدخول (PBKDF2) تتجاوز حد CPU المجاني. اشترك من Billing.
4. My Profile ← API Tokens ← Create Token بقالب **"Edit Cloudflare Workers"**، ثم **أضف صلاحية `Hyperdrive: Edit`** (لأن الـ CI ينشئ إعداد Hyperdrive) ← انسخ التوكن. وانسخ **Account ID** من الشريط الجانبي.

### 3) GitHub — أضف الأسرار والمتغيرات (Settings ← Secrets and variables ← Actions)
5. **Secrets**: `CLOUDFLARE_API_TOKEN` • `DATABASE_URL` (الرابط المباشر) • `SEED_ADMIN_EMAIL` • `SEED_ADMIN_PASSWORD` (12+ حرفاً) • (اختياري) `CLOUDFLARE_ACCOUNT_ID`.
6. **Variable**: `NEXT_PUBLIC_APP_URL` = `https://khuttar.نطاقك.workers.dev`.

### 4) أنشئ Hyperdrive ثم انشر (من واجهة GitHub فقط)
7. تبويب Actions ← **Deploy to Cloudflare Workers** ← Run workflow مع تفعيل **`provision_hyperdrive`** ← بعد نجاحه افتح سجل الوظيفة وانسخ قيمة **`id`** الظاهرة.
8. أضف **Variable** جديداً: `HYPERDRIVE_ID` = القيمة المنسوخة.
9. شغّل **Deploy to Cloudflare Workers** مجدداً مع تفعيل **`seed`** (بدون provision) ← الموقع يصبح حياً على `https://khuttar.نطاقك.workers.dev`.
   بعدها: كل push إلى `main` ينشر تلقائياً (migrate ثم deploy).

### 5) الدومين الرسمي (لاحقاً)
أضف نطاقك إلى Cloudflare (تغيير nameservers) ← صفحة الـ Worker ← Settings ← Domains & Routes ← **Custom domain** ← حدّث المتغيّر `NEXT_PUBLIC_APP_URL` وادفع تغييراً بسيطاً لإعادة النشر.

### بعد النشر مباشرة
- غيّر كلمة مرور الإدارة من `/admin/users`.
- **أضف وكلاءك من `/admin/agents`** (إنشاء مباشر) أو اقبل طلبات `/admin/applications` — بيانات فقط، لا يحتاج أي نشر.
- ابنِ الوجهات والبرامج من اللوحة — الإنتاج يبدأ نظيفاً بلا بيانات تجريبية.
- حدّث بيانات التواصل من `/admin/settings`.

### ملاحظات تشغيلية
- **ثلاثة روابط اتصال لا تُخلط**: Hyperdrive (داخل إعداد Cloudflare، يستخدمه الـ Worker وقت التشغيل) • الرابط المباشر (سر `DATABASE_URL` في GitHub، للهجرات والـ seed فقط) • المحلي (`.env`).
- **ملفات إعداد Cloudflare**: `wrangler.jsonc` للتطوير المحلي (به `localConnectionString` ومعرّف مؤقت) — لا يُلمس. أما الإنتاج فيُولَّد في CI من `wrangler.template.jsonc` عبر `scripts/render-wrangler.mjs` الذي يحقن `HYPERDRIVE_ID` و`NEXT_PUBLIC_APP_URL`.
- التجربة محلياً على بيئة Workers الحقيقية: `pnpm preview` (يبني ويشغّل workerd على :8787 متصلاً بقاعدتك المحلية).
- seed الإنتاج (`pnpm db:seed:prod`) آمن وidempotent؛ الـ seed التجريبي **مدمّر** ولن يعمل بدون `SEED_ALLOW_DESTRUCTIVE=1`.

## صفحة العرض على GitHub Pages

مصدر الصفحة في `docs/` وتُنشر تلقائياً عبر workflow (`.github/workflows/pages.yml`) مع كل تعديل على `docs/` في `main`. لتحديث اللقطات بعد تغييرات الواجهة:

```bash
node scripts/screenshots.mjs   # يتطلب المنصة شغّالة على :3000 ومتصفح headless
```

## خارج نطاق هذه النسخة (مخطط لها لاحقاً)

بوابة دفع (Moyasar/Tap) • رفع الصور (S3) • حسابات عملاء ودخول سائقين • إشعارات واتساب/بريد • واجهة إنجليزية • سحب وإفلات في الباني • تقارير وsitemap
