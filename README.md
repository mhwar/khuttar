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

تم تجهيز كل شيء في المستودع (workflow + إعدادات + seed إنتاج). المتبقي خطوات لوحات التحكم التالية **مرة واحدة**:

### 1) قاعدة البيانات — Neon (مجاني)
1. أنشئ حساباً في console.neon.tech ← New Project ← المنطقة **AWS eu-central-1 (فرانكفورت)** ← اسم القاعدة `khuttar`.
2. (موصى به) Roles ← New Role باسم `hyperdrive-user` ← **انسخ كلمة المرور فوراً** (تظهر مرة واحدة).
3. من Connection Details اختر الفرع/القاعدة/الدور ثم **ألغِ تفعيل Connection pooling** وانسخ الرابط المباشر:
   `postgresql://hyperdrive-user:كلمة_المرور@ep-xxxx.eu-central-1.aws.neon.tech/khuttar?sslmode=require`
   هذا الرابط الواحد يُستخدم في الخطوتين 5 و8.

### 2) Cloudflare
4. أنشئ الحساب ← Workers & Pages ← اختر اسم نطاقك الفرعي `*.workers.dev`.
5. Storage & Databases ← **Hyperdrive** ← Create configuration باسم `khuttar-db` ← الصق رابط Neon المباشر ← **انسخ الـ ID** وضعه في `wrangler.jsonc` بدل القيمة المؤقتة في `hyperdrive[0].id` (ثم ادفع التعديل).
6. الخطة: **Workers Paid ($5/شهر) موصى بها بقوة** — الحزمة الحالية 2.78MiB مضغوطة (تحت حد المجاني 3MiB بهامش ~220KiB فقط)، وعمليات الدخول (PBKDF2) تتجاوز حد CPU للخطة المجانية (10ms). يمكن البدء مجاناً للتجربة وقبول بطء/رفض متقطع للدخول، لكن للإنتاج اشترك في Paid من Billing.
7. My Profile ← API Tokens ← Create Token بقالب **"Edit Cloudflare Workers"** مقيّداً بحسابك ← انسخه. وانسخ **Account ID** من الشريط الجانبي في Workers & Pages.

### 3) GitHub
8. Settings ← Secrets and variables ← Actions ← أضف **Secrets**:
   `CLOUDFLARE_API_TOKEN` • `CLOUDFLARE_ACCOUNT_ID` • `DATABASE_URL` (رابط Neon المباشر) • `SEED_ADMIN_EMAIL` • `SEED_ADMIN_PASSWORD` (12+ حرفاً)
   وأضف **Variable**: `NEXT_PUBLIC_APP_URL` = `https://khuttar.نطاقك.workers.dev` (وحدّث نفس القيمة في `wrangler.jsonc`).
9. أول نشر: تبويب Actions ← **Deploy to Cloudflare Workers** ← Run workflow مع تفعيل خيار `seed` ← بعد نجاحه افتح `/login` وادخل بحساب الإدارة الذي حددته.
   كل push لاحق إلى `main` ينشر تلقائياً (migrate ثم deploy).

### 4) الدومين الرسمي (لاحقاً)
أضف نطاقكم إلى Cloudflare (تغيير nameservers) ← من صفحة الـ Worker: Settings ← Domains & Routes ← **Custom domain** ← حدّث `NEXT_PUBLIC_APP_URL` في المكانين وادفع.

### بعد النشر مباشرة
- غيّر كلمة مرور الإدارة من `/admin/users`.
- **أضف وكلاءك من `/admin/agents`** (إنشاء مباشر) أو اقبل طلبات `/admin/applications` — بيانات فقط، لا يحتاج أي نشر.
- ابنِ الوجهات والبرامج من اللوحة — الإنتاج يبدأ نظيفاً بلا بيانات تجريبية.
- حدّث بيانات التواصل من `/admin/settings`.

### ملاحظات تشغيلية
- **ثلاثة روابط اتصال لا تُخلط**: Hyperdrive (داخل إعداد Cloudflare، يستخدمه الـ Worker) • الرابط المباشر (سر GitHub، للهجرات والـ seed فقط) • المحلي (`.env`).
- التجربة محلياً على بيئة Workers الحقيقية: `pnpm preview` (يبني ويشغّل workerd على :8787 متصلاً بقاعدتك المحلية عبر `localConnectionString`).
- seed الإنتاج (`pnpm db:seed:prod`) آمن وidempotent؛ الـ seed التجريبي **مدمّر** ولن يعمل بدون `SEED_ALLOW_DESTRUCTIVE=1`.

## صفحة العرض على GitHub Pages

مصدر الصفحة في `docs/` وتُنشر تلقائياً عبر workflow (`.github/workflows/pages.yml`) مع كل تعديل على `docs/` في `main`. لتحديث اللقطات بعد تغييرات الواجهة:

```bash
node scripts/screenshots.mjs   # يتطلب المنصة شغّالة على :3000 ومتصفح headless
```

## خارج نطاق هذه النسخة (مخطط لها لاحقاً)

بوابة دفع (Moyasar/Tap) • رفع الصور (S3) • حسابات عملاء ودخول سائقين • إشعارات واتساب/بريد • واجهة إنجليزية • سحب وإفلات في الباني • تقارير وsitemap
