// seed-destinations.ts — إضافة وجهات إدنبرة والعلا وأبها + برنامج إدنبرة المكتمل
// آمن للتشغيل على قاعدة موجودة: يتجاهل ما هو مخزّن مسبقاً (skipDuplicates / upsert).
// الاستخدام:
//   DATABASE_URL=... node_modules/.bin/tsx prisma/seed-destinations.ts

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL مطلوب");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

type ItemSeed = {
  type: string;
  title: string;
  startTime?: string;
  durationMin?: number;
  areaId?: string;
  attractionId?: string;
  notes?: string;
};
type DaySeed = { title: string; description?: string; items: ItemSeed[] };

async function createTour(opts: {
  slug: string;
  title: string;
  summary: string;
  description: string;
  coverImage: string;
  tourType: "DOMESTIC" | "INTERNATIONAL";
  destinationId: string;
  basePrice: number;
  durationDays: number;
  inclusions: string[];
  exclusions: string[];
  featured?: boolean;
  days: DaySeed[];
}) {
  // تجنّب التكرار
  const existing = await db.program.findUnique({ where: { slug: opts.slug } });
  if (existing) { console.log(`  ⏭  برنامج موجود: ${opts.slug}`); return existing; }

  const program = await db.program.create({
    data: {
      slug: opts.slug,
      title: opts.title,
      category: "TOUR",
      summary: opts.summary,
      description: opts.description,
      coverImage: opts.coverImage,
      basePrice: opts.basePrice,
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isApproved: true,
      featured: opts.featured ?? false,
      destinationId: opts.destinationId,
      ownerAgentId: null,
      tourType: opts.tourType,
      durationDays: opts.durationDays,
      inclusions: opts.inclusions.join("\n"),
      exclusions: opts.exclusions.join("\n"),
    },
  });

  for (const [di, day] of opts.days.entries()) {
    const createdDay = await db.itineraryDay.create({
      data: { programId: program.id, dayNumber: di + 1, title: day.title, description: day.description },
    });
    for (const [ii, item] of day.items.entries()) {
      await db.itineraryItem.create({
        data: { dayId: createdDay.id, sortOrder: ii + 1, ...item },
      });
    }
  }
  return program;
}

async function main() {
  console.log("🌍 إضافة وجهات إدنبرة — العلا — أبها...\n");

  // ═══════════════════════════════════════════════════════════════════
  // 1. إدنبرة — اسكتلندا
  // ═══════════════════════════════════════════════════════════════════
  const edinburgh = await db.destination.upsert({
    where: { slug: "edinburgh" },
    update: {},
    create: {
      slug: "edinburgh",
      name: "إدنبرة",
      country: "المملكة المتحدة — اسكتلندا",
      type: "INTERNATIONAL",
      description:
        "عاصمة اسكتلندا تجمع بين قلعة تطل على مدينة لم يمسّها الزمن، وطريق ملكي يصل التاريخ بالحاضر. " +
        "تجربة حضارية نادرة: متاحف مجانية، طبيعة جبلية داخل المدينة، ومهرجان فنوني يملأ المدينة كل أغسطس.",
      image: "/images/edinburgh.svg",
      featured: true,
      sortOrder: 6,
    },
  });
  console.log("✅ إدنبرة:", edinburgh.id);

  // مناطق إدنبرة
  const edinCity = await db.area.upsert({
    where: { id: "area-edin-city" },
    update: {},
    create: { id: "area-edin-city", destinationId: edinburgh.id, kind: "CITY", name: "إدنبرة", sortOrder: 1 },
  }).catch(() => db.area.findFirst({ where: { destinationId: edinburgh.id, name: "إدنبرة" } })) as Awaited<ReturnType<typeof db.area.findFirst>> & { id: string };

  // نستخدم findFirst/create بدل upsert لتجنب تعقيد id الخارجي
  async function getOrCreateArea(data: { destinationId: string; parentId?: string; kind: string; name: string; sortOrder: number }) {
    const ex = await db.area.findFirst({ where: { destinationId: data.destinationId, name: data.name } });
    if (ex) return ex;
    return db.area.create({ data });
  }

  const oldTown  = await getOrCreateArea({ destinationId: edinburgh.id, parentId: edinCity!.id, kind: "DISTRICT", name: "المدينة القديمة", sortOrder: 1 });
  const newTown  = await getOrCreateArea({ destinationId: edinburgh.id, parentId: edinCity!.id, kind: "DISTRICT", name: "المدينة الجديدة", sortOrder: 2 });
  const leith    = await getOrCreateArea({ destinationId: edinburgh.id, parentId: edinCity!.id, kind: "DISTRICT", name: "ليث", sortOrder: 3 });
  const holyrood = await getOrCreateArea({ destinationId: edinburgh.id, parentId: edinCity!.id, kind: "DISTRICT", name: "هوليرود والبرلمان", sortOrder: 4 });
  console.log("  ├ مناطق: المدينة القديمة، الجديدة، ليث، هوليرود");

  // معالم إدنبرة
  async function getOrCreateAttraction(data: Parameters<typeof db.attraction.create>[0]["data"]) {
    const ex = await db.attraction.findFirst({ where: { areaId: data.areaId as string, name: data.name as string } });
    if (ex) return ex;
    return db.attraction.create({ data });
  }

  const edinCastle  = await getOrCreateAttraction({ areaId: oldTown.id, name: "قلعة إدنبرة",              category: "LANDMARK", description: "قلعة فوق جرف بركاني تحرس المدينة منذ القرن التاسع — تضم التاجَين الملكيَّين الاسكتلنديَّين", durationMin: 150, costEstimate: 170 });
  const royalMile   = await getOrCreateAttraction({ areaId: oldTown.id, name: "الطريق الملكي",             category: "LANDMARK", description: "الشارع الرئيسي الذي يربط القلعة بقصر هوليرود — محلات ومطاعم وموسيقيو الشوارع", durationMin: 90,  costEstimate: 0   });
  const grassmkt    = await getOrCreateAttraction({ areaId: oldTown.id, name: "سوق غراسماركيت",            category: "ACTIVITY", description: "ساحة تاريخية محاطة بالحانات والمطاعم — قلب الحياة الليلية لإدنبرة القديمة", durationMin: 90, costEstimate: 0 });
  const scotMuseum  = await getOrCreateAttraction({ areaId: oldTown.id, name: "المتحف الوطني الاسكتلندي",  category: "MUSEUM",   description: "٢٢ صالة تمتد عبر الطبيعة والتاريخ والفن — مجاني ومفتوح كل يوم",           durationMin: 150, costEstimate: 0   });
  const holyroodPal = await getOrCreateAttraction({ areaId: holyrood.id, name: "قصر هوليرود",              category: "LANDMARK", description: "المقر الرسمي للأسرة المالكة في اسكتلندا — جولة مسموعة مُفصَّلة بالعربي",  durationMin: 120, costEstimate: 130 });
  const arthurSeat  = await getOrCreateAttraction({ areaId: holyrood.id, name: "عرش أرثر",                 category: "PARK",     description: "قمة بركانية داخل المدينة ارتفاعها ٢٥١ م — أفضل بانوراما لإدنبرة",          durationMin: 150, costEstimate: 0   });
  const caltonHill  = await getOrCreateAttraction({ areaId: newTown.id,  name: "تل كالتون",                category: "PARK",     description: "تل في قلب المدينة الجديدة — يضم النصب التذكاري الوطني وإطلالة خرافية",  durationMin: 60,  costEstimate: 0   });
  const princesGard = await getOrCreateAttraction({ areaId: newTown.id,  name: "حدائق برينسيز ستريت",      category: "PARK",     description: "حدائق خضراء تفصل المدينتين القديمة والجديدة، أمامها القلعة خلفية خلابة", durationMin: 60,  costEstimate: 0   });
  const botGarden   = await getOrCreateAttraction({ areaId: newTown.id,  name: "الحديقة النباتية الملكية",  category: "PARK",     description: "من أقدم الحدائق النباتية في العالم — ٢٨٠ سنة من الجمال والبحث العلمي",  durationMin: 90,  costEstimate: 0   });
  const whiskyExp   = await getOrCreateAttraction({ areaId: oldTown.id,  name: "تجربة الويسكي الاسكتلندي", category: "ACTIVITY", description: "جولة تفاعلية في صناعة الويسكي الاسكتلندي الأشهر عالمياً",                durationMin: 90,  costEstimate: 165 });
  const royalBrit   = await getOrCreateAttraction({ areaId: leith.id,    name: "اليخت الملكي برتانيا",      category: "LANDMARK", description: "اليخت الملكي البريطاني المُحوَّل لمتحف عائم في ميناء ليث",               durationMin: 120, costEstimate: 130 });
  console.log("  └ معالم: ١١ معلم مُضاف");

  // برنامج إدنبرة ٧ أيام
  const edinburghTour = await createTour({
    slug: "edinburgh-7-days",
    title: "إدنبرة — تجربة اسكتلندا الكاملة",
    summary: "٧ أيام في أجمل مدينة في أوروبا: قلاع وقصور وطبيعة جبلية داخل المدينة.",
    description:
      "إدنبرة ليست مجرد مدينة — هي تجربة حضارية فريدة. " +
      "يأخذك هذا البرنامج من القلعة العريقة إلى عرش أرثر، ومن قصر هوليرود الملكي إلى ميناء ليث الفني. " +
      "متاحف مجانية بمستوى عالمي، مطاعم اسكتلندية أصيلة، وأجواء ترفع الروح في كل حارة وشارع.",
    coverImage: "/images/edinburgh.svg",
    tourType: "INTERNATIONAL",
    destinationId: edinburgh.id,
    basePrice: 6800,
    durationDays: 7,
    featured: true,
    inclusions: [
      "الإقامة ٦ ليالٍ فندق ٤ نجوم في المدينة القديمة مع الإفطار الاسكتلندي",
      "الاستقبال والتوديع من مطار إدنبرة بسيارة خاصة",
      "بطاقة مدينة إدنبرة (City Pass) للمواصلات والمتاحف",
      "جولات مرشد سياحي عربي (أيام ٢، ٣، ٤)",
      "تذكرة قلعة إدنبرة وقصر هوليرود واليخت الملكي",
      "رحلة يومية بالباص لـ Loch Lomond والقلاع الريفية",
    ],
    exclusions: [
      "تذاكر الطيران الدولي",
      "وجبات الغداء والعشاء (المطاعم المقترحة في الجدول)",
      "التأشيرة البريطانية",
      "التأمين على السفر",
    ],
    days: [
      {
        title: "الوصول واستكشاف الطريق الملكي",
        description: "أول لمسة لإدنبرة: الفندق في قلب المدينة القديمة والطريق الملكي مساءً",
        items: [
          { type: "FLIGHT",    title: "الوصول لمطار إدنبرة",                              startTime: "13:00", durationMin: 0,   areaId: edinCity!.id },
          { type: "TRANSPORT", title: "الاستقبال والتوجه للفندق بسيارة خاصة",             startTime: "14:00", durationMin: 30,  areaId: oldTown.id },
          { type: "HOTEL",     title: "تسجيل الدخول — فندق في المدينة القديمة",          startTime: "15:00", durationMin: 60,  areaId: oldTown.id },
          { type: "ACTIVITY",  title: "مشي استكشافي في الطريق الملكي",                    startTime: "17:00", durationMin: 90,  areaId: oldTown.id, attractionId: royalMile.id, notes: "مشي حر — راقب الموسيقيين الاسكتلنديين وتصفح المحلات" },
          { type: "MEAL",      title: "عشاء في أحد مطاعم Old Town",                      startTime: "19:30", durationMin: 90,  areaId: oldTown.id, notes: "موصى به: Ondine للمأكولات البحرية، أو The Witchery للأجواء التاريخية" },
        ],
      },
      {
        title: "قلعة إدنبرة والمتحف الوطني",
        description: "يوم التاريخ الكامل — القلعة صباحاً والمتحف المجاني بعد الظهر",
        items: [
          { type: "MEAL",      title: "إفطار اسكتلندي في الفندق",                         startTime: "08:00", durationMin: 60 },
          { type: "ACTIVITY",  title: "قلعة إدنبرة — التاجان الملكيان وإطلاق مدفع الساعة", startTime: "09:30", durationMin: 150, areaId: oldTown.id, attractionId: edinCastle.id, notes: "احجز التذكرة مسبقاً — الطابور طويل في الموسم" },
          { type: "MEAL",      title: "غداء خفيف في مقهى قرب القلعة",                    startTime: "12:30", durationMin: 60,  areaId: oldTown.id },
          { type: "ACTIVITY",  title: "المتحف الوطني الاسكتلندي — مجاني",                startTime: "14:00", durationMin: 150, areaId: oldTown.id, attractionId: scotMuseum.id, notes: "لا تفوّت طابق الطبيعة والطابق الاسكتلندي" },
          { type: "ACTIVITY",  title: "سوق غراسماركيت والتجول بين الحارات",              startTime: "17:30", durationMin: 90,  areaId: oldTown.id, attractionId: grassmkt.id },
          { type: "MEAL",      title: "عشاء في غراسماركيت",                               startTime: "20:00", durationMin: 90,  areaId: oldTown.id },
        ],
      },
      {
        title: "قصر هوليرود وعرش أرثر",
        description: "الجانب الجنوبي الشرقي: القصر الملكي ثم تسلق القمة البركانية",
        items: [
          { type: "MEAL",      title: "إفطار في الفندق",                                   startTime: "08:00", durationMin: 60 },
          { type: "ACTIVITY",  title: "قصر هوليرود — الجولة المسموعة بالعربي",            startTime: "09:30", durationMin: 120, areaId: holyrood.id, attractionId: holyroodPal.id, notes: "المقر الرسمي للملكة في اسكتلندا — استمع للجولة الصوتية بدقة" },
          { type: "MEAL",      title: "غداء في كافيه البرلمان الاسكتلندي",               startTime: "12:00", durationMin: 60,  areaId: holyrood.id },
          { type: "ACTIVITY",  title: "تسلق عرش أرثر — أفضل بانوراما لإدنبرة",          startTime: "14:00", durationMin: 150, areaId: holyrood.id, attractionId: arthurSeat.id, notes: "ارتدِ حذاءً مريحاً — الصعود سهل نسبياً ومكافأته رهيبة" },
          { type: "FREE_TIME", title: "وقت حر في Holyrood Park",                          startTime: "17:00", durationMin: 60,  areaId: holyrood.id },
          { type: "MEAL",      title: "عشاء في المدينة القديمة",                           startTime: "19:30", durationMin: 90,  areaId: oldTown.id },
        ],
      },
      {
        title: "المدينة الجديدة — الحدائق والبوتانيكال",
        description: "جورجيان أركيتكشر وحدائق ملكية وتجربة الويسكي",
        items: [
          { type: "MEAL",      title: "إفطار في الفندق",                                   startTime: "08:00", durationMin: 60 },
          { type: "ACTIVITY",  title: "حدائق برينسيز ستريت — صورة القلعة الأيقونية",     startTime: "09:30", durationMin: 60,  areaId: newTown.id, attractionId: princesGard.id },
          { type: "ACTIVITY",  title: "الحديقة النباتية الملكية — مجانية",               startTime: "11:00", durationMin: 90,  areaId: newTown.id, attractionId: botGarden.id, notes: "من أقدم وأجمل الحدائق في أوروبا — مناسبة للاسترخاء" },
          { type: "MEAL",      title: "غداء في مطعم على شارع George St",                 startTime: "13:00", durationMin: 75,  areaId: newTown.id },
          { type: "ACTIVITY",  title: "تجربة الويسكي الاسكتلندي — جولة تفاعلية",        startTime: "15:00", durationMin: 90,  areaId: oldTown.id, attractionId: whiskyExp.id, notes: "جولة مسلية حتى لمن لا يشرب الكحول — تعلم التاريخ والصناعة" },
          { type: "FREE_TIME", title: "تسوق في Princes Street",                           startTime: "17:00", durationMin: 120, areaId: newTown.id },
          { type: "MEAL",      title: "عشاء في المدينة الجديدة",                           startTime: "20:00", durationMin: 90,  areaId: newTown.id },
        ],
      },
      {
        title: "رحلة يومية — Loch Lomond والقلاع الريفية",
        description: "خروج من المدينة نحو الطبيعة الاسكتلندية الساحرة",
        items: [
          { type: "MEAL",      title: "إفطار مبكر في الفندق",                              startTime: "07:30", durationMin: 45 },
          { type: "TRANSPORT", title: "باص مجموعة إلى Loch Lomond",                       startTime: "08:30", durationMin: 90,  areaId: edinCity!.id, notes: "مسافة ساعة ونصف غرباً من إدنبرة" },
          { type: "ACTIVITY",  title: "بحيرة Loch Lomond — أولى بحيرات الهايلاندز",     startTime: "10:30", durationMin: 120, notes: "جولة بحرية اختيارية أو مشي على الشاطئ" },
          { type: "MEAL",      title: "غداء في قرية Luss التاريخية",                     startTime: "13:00", durationMin: 75 },
          { type: "ACTIVITY",  title: "قلعة Stirling — قلعة ماري ملكة اسكتلندا",        startTime: "15:30", durationMin: 120, notes: "توقف على الطريق للعودة — قلعة لا تقل روعة عن إدنبرة" },
          { type: "TRANSPORT", title: "العودة إلى إدنبرة",                                startTime: "18:30", durationMin: 90,  areaId: edinCity!.id },
          { type: "MEAL",      title: "عشاء في المدينة القديمة",                           startTime: "20:30", durationMin: 90,  areaId: oldTown.id },
        ],
      },
      {
        title: "ليث وتل كالتون",
        description: "حي الميناء الفني واليخت الملكي وأجمل غروب في المدينة",
        items: [
          { type: "MEAL",      title: "إفطار في الفندق",                                   startTime: "08:30", durationMin: 60 },
          { type: "ACTIVITY",  title: "اليخت الملكي برتانيا في ميناء ليث",               startTime: "10:00", durationMin: 120, areaId: leith.id, attractionId: royalBrit.id, notes: "متحف عائم يروي قصص الأسرة المالكة — جولة مسموعة تفصيلية" },
          { type: "MEAL",      title: "غداء مأكولات بحرية في مطاعم ليث الواجهة المائية", startTime: "13:00", durationMin: 75,  areaId: leith.id },
          { type: "FREE_TIME", title: "استكشاف حي ليث الفني والغاليريات",                 startTime: "15:00", durationMin: 90,  areaId: leith.id },
          { type: "ACTIVITY",  title: "تل كالتون — أفضل موقع لمشاهدة غروب الشمس",       startTime: "18:00", durationMin: 90,  areaId: newTown.id, attractionId: caltonHill.id, notes: "الغروب في الصيف بعد ٢١:٠٠ — تجربة لن تُنسى" },
          { type: "MEAL",      title: "عشاء أخير في إدنبرة — احتفلوا بالرحلة",          startTime: "21:00", durationMin: 90,  areaId: oldTown.id },
        ],
      },
      {
        title: "المغادرة",
        description: "صباح حر للتسوق الأخير ثم وداع إدنبرة",
        items: [
          { type: "MEAL",      title: "إفطار في الفندق",                                   startTime: "08:00", durationMin: 60 },
          { type: "FREE_TIME", title: "تسوق أخير — سوق فيكتوريا وهدايا تذكارية",        startTime: "09:30", durationMin: 120, areaId: oldTown.id, notes: "Shortbread، ويسكي مُعبَّأ، وKilts — أفضل الهدايا الاسكتلندية" },
          { type: "HOTEL",     title: "تسجيل الخروج من الفندق",                           startTime: "12:00", durationMin: 30,  areaId: oldTown.id },
          { type: "TRANSPORT", title: "التوصيل لمطار إدنبرة بسيارة خاصة",                startTime: "13:00", durationMin: 30,  areaId: edinCity!.id },
          { type: "FLIGHT",    title: "المغادرة من مطار إدنبرة",                          startTime: "16:00", durationMin: 0 },
        ],
      },
    ],
  });
  console.log("\n✅ برنامج إدنبرة:", edinburghTour.slug);

  // ═══════════════════════════════════════════════════════════════════
  // 2. العُلا — وجهة مستقلة
  // ═══════════════════════════════════════════════════════════════════
  const alula = await db.destination.upsert({
    where: { slug: "alula" },
    update: {},
    create: {
      slug: "alula",
      name: "العُلا",
      country: "المملكة العربية السعودية",
      type: "DOMESTIC",
      description:
        "أول موقع سعودي على قائمة التراث العالمي لليونسكو — مدينة تسبق التاريخ المكتوب. " +
        "مقابر النبطيين المنحوتة في الصخر، وادي ديدان الحضارة الألفية، وجبل إكمه المكتبة الصخرية. " +
        "وجهة لا تشبهها أي وجهة على وجه الأرض.",
      image: "/images/alula.svg",
      featured: true,
      sortOrder: 7,
    },
  });
  console.log("\n✅ العلا:", alula.id);

  const alulaCity    = await getOrCreateArea({ destinationId: alula.id, kind: "CITY",     name: "العلا",            sortOrder: 1 });
  const oldTownAlula = await getOrCreateArea({ destinationId: alula.id, parentId: alulaCity.id, kind: "DISTRICT", name: "البلدة القديمة",    sortOrder: 1 });
  const hijr         = await getOrCreateArea({ destinationId: alula.id, parentId: alulaCity.id, kind: "DISTRICT", name: "الحِجر — مدائن صالح", sortOrder: 2 });
  const dadan        = await getOrCreateArea({ destinationId: alula.id, parentId: alulaCity.id, kind: "DISTRICT", name: "ديدان الأثرية",       sortOrder: 3 });
  const jIkmah       = await getOrCreateArea({ destinationId: alula.id, parentId: alulaCity.id, kind: "DISTRICT", name: "جبل إكمه",            sortOrder: 4 });
  const gharameel    = await getOrCreateArea({ destinationId: alula.id, parentId: alulaCity.id, kind: "DISTRICT", name: "الغريميل",            sortOrder: 5 });
  console.log("  ├ مناطق: البلدة القديمة، الحجر، ديدان، إكمه، الغريميل");

  const hegra      = await getOrCreateAttraction({ areaId: hijr.id,         name: "مدائن صالح (الحِجر)",           category: "LANDMARK", description: "٩٤ مقبرة نبطية منحوتة في جبال الحجر الرملي — أول موقع سعودي بقائمة يونسكو ٢٠٠٨",      durationMin: 240, costEstimate: 95  });
  const jFilAlula  = await getOrCreateAttraction({ areaId: hijr.id,         name: "جبل الفيل",                     category: "LANDMARK", description: "صخرة بحجم الفيل نحتها الزمن في قلب الصحراء — رمز العلا الأشهر",                    durationMin: 60,  costEstimate: 0   });
  const dadanRuins = await getOrCreateAttraction({ areaId: dadan.id,        name: "ديدان — عاصمة اللحيانيين",      category: "LANDMARK", description: "عاصمة مملكة ديدان ثم اللحيانيين: معابد ومقابر ونقوش تمتد ٣٠٠٠ سنة",                durationMin: 120, costEstimate: 75  });
  const ikma       = await getOrCreateAttraction({ areaId: jIkmah.id,       name: "جبل إكمه — المكتبة الصخرية",   category: "LANDMARK", description: "أكثر من ٥٠٠ نقش بالنبطية واللحيانية والأرامية — أكبر تجمع نقوش أثرية في المنطقة",  durationMin: 120, costEstimate: 60  });
  const gharameel2 = await getOrCreateAttraction({ areaId: gharameel.id,    name: "الغريميل — متاهة الصخور",       category: "LANDMARK", description: "تكوينات صخرية طبيعية بأشكال خيالية — أفضل للصور عند الشروق والغروب",               durationMin: 120, costEstimate: 45  });
  const oldTownAtt = await getOrCreateAttraction({ areaId: oldTownAlula.id, name: "البلدة القديمة وطريق البخور",   category: "LANDMARK", description: "٩٠٠ منزل طيني متلاصق عمرها ٨٠٠ سنة ومتحف قديم يروي قصة طريق البخور",              durationMin: 90,  costEstimate: 30  });
  const alulaOasis = await getOrCreateAttraction({ areaId: alulaCity.id,    name: "واحة العلا وبساتين النخيل",     category: "PARK",     description: "٣٠ كيلومتراً من البساتين الخضراء وسط الصحراء — أجمل ما في العلا",                  durationMin: 90,  costEstimate: 0   });
  const khurayba   = await getOrCreateAttraction({ areaId: dadan.id,        name: "الخريبة — مقابر الأسد",         category: "LANDMARK", description: "تماثيل أسود محفورة في الجرف فوق مقابر اللحيانيين — فريدة في العالم",               durationMin: 90,  costEstimate: 60  });
  console.log("  └ معالم: ٨ معلم مُضاف");

  // ═══════════════════════════════════════════════════════════════════
  // 3. أبها — وجهة داخلية
  // ═══════════════════════════════════════════════════════════════════
  const abha = await db.destination.upsert({
    where: { slug: "abha" },
    update: {},
    create: {
      slug: "abha",
      name: "أبها",
      country: "المملكة العربية السعودية",
      type: "DOMESTIC",
      description:
        "عروس جبال السروات على ارتفاع ٢٢٠٠ متر — تجمع بين هواء البادية المنعش وخضرة الأودية وتراث العسير الأصيل. " +
        "السودة أعلى قمة في المملكة، وحبالة قرية معلقة على جرف شاهق، وتلفريك أبها أحد أجمل المناظر الجبلية في الخليج.",
      image: "/images/abha.svg",
      featured: true,
      sortOrder: 8,
    },
  });
  console.log("\n✅ أبها:", abha.id);

  const abhaCity  = await getOrCreateArea({ destinationId: abha.id, kind: "CITY",   name: "أبها",         sortOrder: 1 });
  const abhaDown  = await getOrCreateArea({ destinationId: abha.id, parentId: abhaCity.id, kind: "DISTRICT", name: "وسط أبها والتلفريك",  sortOrder: 1 });
  const soudasArea = await getOrCreateArea({ destinationId: abha.id, parentId: abhaCity.id, kind: "DISTRICT", name: "السودة",              sortOrder: 2 });
  const habala    = await getOrCreateArea({ destinationId: abha.id, parentId: abhaCity.id, kind: "DISTRICT", name: "الحبالة",             sortOrder: 3 });
  const alqabil   = await getOrCreateArea({ destinationId: abha.id, parentId: abhaCity.id, kind: "DISTRICT", name: "قرية القابل التراثية", sortOrder: 4 });
  const rijal     = await getOrCreateArea({ destinationId: abha.id, kind: "GOVERNORATE", name: "رجال ألمع", sortOrder: 2 });
  console.log("  ├ مناطق: وسط أبها، السودة، الحبالة، القابل، رجال ألمع");

  const telferik   = await getOrCreateAttraction({ areaId: abhaDown.id,  name: "تلفريك أبها — إطلالة جبال السروات",   category: "ACTIVITY", description: "كابل من قلعة أبها ينزل ٣ كم فوق الأودية الخضراء — أطول تلفريك في المملكة", durationMin: 90,  costEstimate: 50  });
  const abhaFort   = await getOrCreateAttraction({ areaId: abhaDown.id,  name: "قلعة أبها التاريخية",                  category: "LANDMARK", description: "قلعة عثمانية تتوسط المدينة — تُشرف على الأودية وتروي تاريخ عسير",          durationMin: 60,  costEstimate: 0   });
  const soudaTop   = await getOrCreateAttraction({ areaId: soudasArea.id, name: "منتزه السودة — أعلى قمة في المملكة",  category: "PARK",     description: "ارتفاع ٣٠١٥ م — تلفريك وحدائق وإطلالات فوق الغيوم جنوب غرب السعودية",   durationMin: 180, costEstimate: 30  });
  const habalaVil  = await getOrCreateAttraction({ areaId: habala.id,    name: "قرية الحبالة المعلقة",                  category: "LANDMARK", description: "قرية بُنيت على جرف رأسي ارتفاعه ٣٠٠ م — يصلها تلفريك وقد سكنها الحبل (أهل الجبل)", durationMin: 150, costEstimate: 60  });
  const qabilVil   = await getOrCreateAttraction({ areaId: alqabil.id,   name: "قرية القابل الأثرية",                   category: "LANDMARK", description: "قرية طينية بعمارة عسيرية أصيلة محاطة بالزراعات المدرجة",                   durationMin: 90,  costEstimate: 20  });
  const rijalAlma  = await getOrCreateAttraction({ areaId: rijal.id,     name: "قرية رجال ألمع",                        category: "LANDMARK", description: "القرية الأثرية الأشهر في عسير — منازل حجرية بطراز هندسي فريد يعلوها قرون المها", durationMin: 150, costEstimate: 25  });
  const muhayel    = await getOrCreateAttraction({ areaId: abhaCity.id,  name: "متحف ذاكرة عسير",                       category: "MUSEUM",   description: "يروي حضارة عسير من قبل الإسلام لعصر الوحدة — تحف وأزياء وأدوات يومية",       durationMin: 90,  costEstimate: 15  });
  const shada      = await getOrCreateAttraction({ areaId: abhaDown.id,  name: "قصر شدا الملكي",                        category: "LANDMARK", description: "قصر الملك عبدالعزيز في أبها — تحوّل لمتحف يُطل على المدينة",                  durationMin: 60,  costEstimate: 20  });
  console.log("  └ معالم: ٨ معلم مُضاف");

  // ═══════════════════════════════════════════════════════════════════
  // ملخص
  // ═══════════════════════════════════════════════════════════════════
  const totalDest = await db.destination.count();
  const totalArea = await db.area.count();
  const totalAtt  = await db.attraction.count();
  const totalProg = await db.program.count();
  const totalDays = await db.itineraryDay.count();
  const totalItems= await db.itineraryItem.count();

  console.log("\n📊 قاعدة البيانات الآن:");
  console.table({ destinations: totalDest, areas: totalArea, attractions: totalAtt, programs: totalProg, itineraryDays: totalDays, itineraryItems: totalItems });
  console.log(`
✅ تم بنجاح:
  • إدنبرة  : ${edinburgh.id}  —  برنامج ٧ أيام (${edinburghTour.id})
  • العلا   : ${alula.id}
  • أبها    : ${abha.id}

روابط للتجربة:
  • /destinations       — كل الوجهات
  • /destinations/edinburgh
  • /destinations/alula
  • /destinations/abha
  • /programs/edinburgh-7-days
`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
