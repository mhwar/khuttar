import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const db = new PrismaClient();

const PASSWORD = "Khattar123!";

async function main() {
  // This seed WIPES every table — never point it at production.
  if (process.env.SEED_ALLOW_DESTRUCTIVE !== "1") {
    throw new Error(
      "هذا الـ seed التجريبي يمسح كل البيانات. شغّله محلياً فقط مع SEED_ALLOW_DESTRUCTIVE=1",
    );
  }
  console.log("🌱 إعادة تهيئة البيانات التجريبية...");

  // Reverse-dependency cleanup (dev-style reset).
  await db.ledgerEntry.deleteMany();
  await db.payment.deleteMany();
  await db.transfer.deleteMany();
  await db.bookingRequest.deleteMany();
  await db.itineraryItem.deleteMany();
  await db.itineraryDay.deleteMany();
  await db.program.deleteMany();
  await db.attraction.deleteMany();
  await db.area.deleteMany();
  await db.destination.deleteMany();
  await db.driver.deleteMany();
  await db.serviceProvider.deleteMany();
  await db.agentApplication.deleteMany();
  await db.contactMessage.deleteMany();
  await db.testimonial.deleteMany();
  await db.siteSetting.deleteMany();
  await db.session.deleteMany();
  await db.agentProfile.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await hashPassword(PASSWORD);

  // ── Users & agents ────────────────────────────────────────────
  const admin = await db.user.create({
    data: {
      name: "إدارة خطار",
      email: "admin@khattar.sa",
      passwordHash,
      role: "ADMIN",
    },
  });

  const agentUser = await db.user.create({
    data: {
      name: "أحمد الحربي",
      email: "agent@khattar.sa",
      passwordHash,
      role: "AGENT",
      agentProfile: {
        create: {
          referralCode: "AHMED10",
          phone: "0551112222",
          city: "الرياض",
          companyName: "مكتب الحربي للسفر",
          commissionRate: 10,
          platformFeeRate: 5,
          status: "APPROVED",
        },
      },
    },
    include: { agentProfile: true },
  });
  const agent = agentUser.agentProfile!;

  await db.user.create({
    data: {
      name: "نورة السبيعي",
      email: "noura@example.com",
      passwordHash,
      role: "AGENT",
      agentProfile: {
        create: {
          referralCode: "NOURA25",
          phone: "0553334444",
          city: "جدة",
          status: "PENDING",
        },
      },
    },
  });

  // ── Destinations / areas / attractions ────────────────────────
  const saudi = await db.destination.create({
    data: {
      slug: "saudi-arabia",
      name: "السعودية",
      country: "المملكة العربية السعودية",
      type: "DOMESTIC",
      description:
        "من صحاري العلا التاريخية إلى جبال أبها وكورنيش جدة — وجهات داخلية تكتشفها كأنك تزورها لأول مرة.",
      image: "/images/saudi.svg",
      featured: true,
      sortOrder: 1,
    },
  });

  const riyadhRegion = await db.area.create({
    data: { destinationId: saudi.id, kind: "REGION", name: "منطقة الرياض", sortOrder: 1 },
  });
  const riyadhCity = await db.area.create({
    data: {
      destinationId: saudi.id,
      parentId: riyadhRegion.id,
      kind: "CITY",
      name: "الرياض",
      sortOrder: 1,
    },
  });
  const diriyah = await db.area.create({
    data: {
      destinationId: saudi.id,
      parentId: riyadhCity.id,
      kind: "DISTRICT",
      name: "الدرعية",
      sortOrder: 2,
    },
  });
  const makkahRegion = await db.area.create({
    data: { destinationId: saudi.id, kind: "REGION", name: "منطقة مكة المكرمة", sortOrder: 2 },
  });
  const jeddah = await db.area.create({
    data: {
      destinationId: saudi.id,
      parentId: makkahRegion.id,
      kind: "CITY",
      name: "جدة",
      sortOrder: 1,
    },
  });
  const madinahRegion = await db.area.create({
    data: { destinationId: saudi.id, kind: "REGION", name: "منطقة المدينة المنورة", sortOrder: 3 },
  });
  const alula = await db.area.create({
    data: {
      destinationId: saudi.id,
      parentId: madinahRegion.id,
      kind: "GOVERNORATE",
      name: "العلا",
      sortOrder: 1,
    },
  });

  const turkey = await db.destination.create({
    data: {
      slug: "turkey",
      name: "تركيا",
      country: "تركيا",
      type: "INTERNATIONAL",
      description:
        "إسطنبول حيث تلتقي القارات، والشمال التركي بطبيعته الساحرة — وجهة العائلات الأولى.",
      image: "/images/turkey.svg",
      featured: true,
      sortOrder: 2,
    },
  });
  const istanbul = await db.area.create({
    data: { destinationId: turkey.id, kind: "CITY", name: "إسطنبول", sortOrder: 1 },
  });
  const trabzon = await db.area.create({
    data: { destinationId: turkey.id, kind: "CITY", name: "طرابزون", sortOrder: 2 },
  });
  const uzungol = await db.area.create({
    data: {
      destinationId: turkey.id,
      parentId: trabzon.id,
      kind: "DISTRICT",
      name: "أوزنجول",
      sortOrder: 1,
    },
  });

  const georgia = await db.destination.create({
    data: {
      slug: "georgia",
      name: "جورجيا",
      country: "جورجيا",
      type: "INTERNATIONAL",
      description:
        "تبليسي العريقة وباتومي الساحلية وجبال القوقاز الخضراء — طبيعة تأسر الزائر صيفاً وشتاءً.",
      image: "/images/georgia.svg",
      featured: true,
      sortOrder: 3,
    },
  });
  const tbilisi = await db.area.create({
    data: { destinationId: georgia.id, kind: "CITY", name: "تبليسي", sortOrder: 1 },
  });
  const batumi = await db.area.create({
    data: { destinationId: georgia.id, kind: "CITY", name: "باتومي", sortOrder: 2 },
  });

  const uk = await db.destination.create({
    data: {
      slug: "united-kingdom",
      name: "المملكة المتحدة",
      country: "المملكة المتحدة",
      type: "INTERNATIONAL",
      description:
        "وجهة الدراسة الأولى: معاهد لغة عريقة وجامعات مرموقة في لندن ومانشستر وغيرهما.",
      image: "/images/uk.svg",
      featured: true,
      sortOrder: 4,
    },
  });
  await db.area.create({
    data: { destinationId: uk.id, kind: "CITY", name: "لندن", sortOrder: 1 },
  });
  await db.area.create({
    data: { destinationId: uk.id, kind: "CITY", name: "مانشستر", sortOrder: 2 },
  });

  const azerbaijan = await db.destination.create({
    data: {
      slug: "azerbaijan",
      name: "أذربيجان",
      country: "أذربيجان",
      type: "INTERNATIONAL",
      description: "باكو وقباء وشلالات الطبيعة — وجهة صاعدة بأسعار مناسبة.",
      image: "/images/azerbaijan.svg",
      sortOrder: 5,
    },
  });
  await db.area.create({
    data: { destinationId: azerbaijan.id, kind: "CITY", name: "باكو", sortOrder: 1 },
  });

  // ── Edinburgh ──────────────────────────────────────────────────
  const edinburgh = await db.destination.create({
    data: {
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
  const edinCity  = await db.area.create({ data: { destinationId: edinburgh.id, kind: "CITY",     name: "إدنبرة",               sortOrder: 1 } });
  const oldTown   = await db.area.create({ data: { destinationId: edinburgh.id, parentId: edinCity.id, kind: "DISTRICT", name: "المدينة القديمة",    sortOrder: 1 } });
  const newTown   = await db.area.create({ data: { destinationId: edinburgh.id, parentId: edinCity.id, kind: "DISTRICT", name: "المدينة الجديدة",    sortOrder: 2 } });
  const leith     = await db.area.create({ data: { destinationId: edinburgh.id, parentId: edinCity.id, kind: "DISTRICT", name: "ليث",                sortOrder: 3 } });
  const holyrood  = await db.area.create({ data: { destinationId: edinburgh.id, parentId: edinCity.id, kind: "DISTRICT", name: "هوليرود والبرلمان", sortOrder: 4 } });

  // ── العلا — وجهة مستقلة ──────────────────────────────────────
  const alulaD = await db.destination.create({
    data: {
      slug: "alula",
      name: "العُلا",
      country: "المملكة العربية السعودية",
      type: "DOMESTIC",
      description:
        "أول موقع سعودي على قائمة التراث العالمي لليونسكو — مدينة تسبق التاريخ المكتوب. " +
        "مقابر النبطيين المنحوتة في الصخر، ووادي ديدان الحضارة الألفية، وجبل إكمه المكتبة الصخرية.",
      image: "/images/alula.svg",
      featured: true,
      sortOrder: 7,
    },
  });
  const alulaCity    = await db.area.create({ data: { destinationId: alulaD.id, kind: "CITY",     name: "العلا",               sortOrder: 1 } });
  const oldTownAl    = await db.area.create({ data: { destinationId: alulaD.id, parentId: alulaCity.id, kind: "DISTRICT", name: "البلدة القديمة",    sortOrder: 1 } });
  const hijrArea     = await db.area.create({ data: { destinationId: alulaD.id, parentId: alulaCity.id, kind: "DISTRICT", name: "الحِجر — مدائن صالح", sortOrder: 2 } });
  const dadanArea    = await db.area.create({ data: { destinationId: alulaD.id, parentId: alulaCity.id, kind: "DISTRICT", name: "ديدان الأثرية",       sortOrder: 3 } });
  const jIkmahArea   = await db.area.create({ data: { destinationId: alulaD.id, parentId: alulaCity.id, kind: "DISTRICT", name: "جبل إكمه",            sortOrder: 4 } });
  const gharameelArea= await db.area.create({ data: { destinationId: alulaD.id, parentId: alulaCity.id, kind: "DISTRICT", name: "الغريميل",            sortOrder: 5 } });

  // ── أبها ──────────────────────────────────────────────────────
  const abha = await db.destination.create({
    data: {
      slug: "abha",
      name: "أبها",
      country: "المملكة العربية السعودية",
      type: "DOMESTIC",
      description:
        "عروس جبال السروات على ارتفاع ٢٢٠٠ متر — هواء بارد وخضرة وتراث عسيري أصيل. " +
        "السودة أعلى قمة في المملكة، وحبالة قرية معلقة على جرف شاهق، وتلفريك أبها من أجمل الإطلالات الجبلية في الخليج.",
      image: "/images/abha.svg",
      featured: true,
      sortOrder: 8,
    },
  });
  const abhaCity   = await db.area.create({ data: { destinationId: abha.id, kind: "CITY",         name: "أبها",                 sortOrder: 1 } });
  const abhaDown   = await db.area.create({ data: { destinationId: abha.id, parentId: abhaCity.id, kind: "DISTRICT", name: "وسط أبها والتلفريك",  sortOrder: 1 } });
  const soudasArea = await db.area.create({ data: { destinationId: abha.id, parentId: abhaCity.id, kind: "DISTRICT", name: "السودة",              sortOrder: 2 } });
  const habalaArea = await db.area.create({ data: { destinationId: abha.id, parentId: abhaCity.id, kind: "DISTRICT", name: "الحبالة",             sortOrder: 3 } });
  const alqabilArea= await db.area.create({ data: { destinationId: abha.id, parentId: abhaCity.id, kind: "DISTRICT", name: "قرية القابل التراثية", sortOrder: 4 } });
  const rijalArea  = await db.area.create({ data: { destinationId: abha.id, kind: "GOVERNORATE",   name: "رجال ألمع",            sortOrder: 2 } });

  // Attractions
  const [
    boulevard,
    nationalMuseum,
    turaif,
    ,
    ,
    hegra,
    hagiaSophia,
    blueMosque,
    bosphorus,
    uzungolLake,
    sultanMurad,
    oldTbilisi,
    batumiBlvd,
    botanicalGarden,
  ] = await Promise.all(
    (
      [
        [riyadhCity.id, "بوليفارد رياض سيتي", "ACTIVITY", "منطقة ترفيه ومطاعم وفعاليات موسمية", 180, 150],
        [riyadhCity.id, "المتحف الوطني", "MUSEUM", "رحلة عبر تاريخ الجزيرة العربية", 120, 30],
        [diriyah.id, "حي طريف التاريخي", "LANDMARK", "موقع تراث عالمي — قلب الدولة السعودية الأولى", 150, 80],
        [jeddah.id, "كورنيش جدة", "PARK", "واجهة بحرية بطول ٤ كم مع نافورة الملك فهد", 120, 0],
        [jeddah.id, "جدة التاريخية (البلد)", "LANDMARK", "بيوت الرواشين والأسواق القديمة", 150, 50],
        [alula.id, "مدائن صالح (الحِجر)", "LANDMARK", "أول موقع سعودي في قائمة التراث العالمي", 240, 95],
        [istanbul.id, "آيا صوفيا", "LANDMARK", "تحفة معمارية بألف وخمسمئة عام من التاريخ", 90, 25],
        [istanbul.id, "الجامع الأزرق", "LANDMARK", "أيقونة إسطنبول بمآذنه الست", 60, 0],
        [istanbul.id, "جولة البوسفور البحرية", "ACTIVITY", "عبور بين قارتين بإطلالات القصور العثمانية", 120, 60],
        [uzungol.id, "بحيرة أوزنجول", "PARK", "بحيرة جبلية تحيط بها الغابات والمساجد الخشبية", 180, 0],
        [trabzon.id, "مرتفعات السلطان مراد", "PARK", "إطلالة فوق الغيوم على ارتفاع ٢٥٠٠ متر", 150, 40],
        [tbilisi.id, "تبليسي القديمة", "LANDMARK", "الحمامات الكبريتية وقلعة ناريكالا والتلفريك", 180, 30],
        [batumi.id, "كورنيش باتومي", "PARK", "واجهة البحر الأسود وبرج الحروف الأبجدية", 120, 0],
        [batumi.id, "الحديقة النباتية", "PARK", "من أكبر الحدائق النباتية في المنطقة بإطلالة بحرية", 150, 20],
      ] as const
    ).map(([areaId, name, category, description, durationMin, costEstimate]) =>
      db.attraction.create({
        data: { areaId, name, category, description, durationMin, costEstimate },
      }),
    ),
  );

  // ── معالم إدنبرة ──────────────────────────────────────────────
  const edinCastle  = await db.attraction.create({ data: { areaId: oldTown.id,  name: "قلعة إدنبرة",               category: "LANDMARK", description: "قلعة فوق جرف بركاني تحرس المدينة منذ القرن التاسع — تضم التاجَين الملكيَّين الاسكتلنديَّين", durationMin: 150, costEstimate: 170 } });
  const royalMile   = await db.attraction.create({ data: { areaId: oldTown.id,  name: "الطريق الملكي",             category: "LANDMARK", description: "الشارع الرئيسي الذي يربط القلعة بقصر هوليرود — محلات ومطاعم وموسيقيو الشوارع",               durationMin: 90,  costEstimate: 0   } });
  const grassmkt    = await db.attraction.create({ data: { areaId: oldTown.id,  name: "سوق غراسماركيت",            category: "ACTIVITY", description: "ساحة تاريخية محاطة بالحانات والمطاعم — قلب الحياة الليلية لإدنبرة القديمة",                    durationMin: 90,  costEstimate: 0   } });
  const scotMuseum  = await db.attraction.create({ data: { areaId: oldTown.id,  name: "المتحف الوطني الاسكتلندي",  category: "MUSEUM",   description: "٢٢ صالة تمتد عبر الطبيعة والتاريخ والفن — مجاني ومفتوح كل يوم",                               durationMin: 150, costEstimate: 0   } });
  const holyroodPal = await db.attraction.create({ data: { areaId: holyrood.id, name: "قصر هوليرود",               category: "LANDMARK", description: "المقر الرسمي للأسرة المالكة في اسكتلندا — جولة مسموعة بالعربي",                               durationMin: 120, costEstimate: 130 } });
  const arthurSeat  = await db.attraction.create({ data: { areaId: holyrood.id, name: "عرش أرثر",                  category: "PARK",     description: "قمة بركانية داخل المدينة ارتفاعها ٢٥١ م — أفضل بانوراما لإدنبرة",                              durationMin: 150, costEstimate: 0   } });
  const caltonHill  = await db.attraction.create({ data: { areaId: newTown.id,  name: "تل كالتون",                 category: "PARK",     description: "تل في قلب المدينة الجديدة — يضم النصب التذكاري الوطني وإطلالة خرافية",                         durationMin: 60,  costEstimate: 0   } });
  const princesGard = await db.attraction.create({ data: { areaId: newTown.id,  name: "حدائق برينسيز ستريت",       category: "PARK",     description: "حدائق خضراء تفصل المدينتين القديمة والجديدة، أمامها القلعة خلفية خلابة",                         durationMin: 60,  costEstimate: 0   } });
  const botGardenEd = await db.attraction.create({ data: { areaId: newTown.id,  name: "الحديقة النباتية الملكية",  category: "PARK",     description: "من أقدم الحدائق النباتية في العالم — ٢٨٠ سنة من الجمال والبحث العلمي",                          durationMin: 90,  costEstimate: 0   } });
  const whiskyExp   = await db.attraction.create({ data: { areaId: oldTown.id,  name: "تجربة الويسكي الاسكتلندي", category: "ACTIVITY", description: "جولة تفاعلية في صناعة الويسكي الاسكتلندي الأشهر عالمياً",                                       durationMin: 90,  costEstimate: 165 } });
  const royalBrit   = await db.attraction.create({ data: { areaId: leith.id,    name: "اليخت الملكي برتانيا",      category: "LANDMARK", description: "اليخت الملكي البريطاني المُحوَّل لمتحف عائم في ميناء ليث",                                       durationMin: 120, costEstimate: 130 } });

  // ── معالم العلا ──────────────────────────────────────────────
  const hegraSeed   = await db.attraction.create({ data: { areaId: hijrArea.id,      name: "مدائن صالح (الحِجر)",         category: "LANDMARK", description: "٩٤ مقبرة نبطية منحوتة في الحجر الرملي — أول موقع سعودي بقائمة يونسكو ٢٠٠٨",           durationMin: 240, costEstimate: 95  } });
  const jFilAlD     = await db.attraction.create({ data: { areaId: hijrArea.id,      name: "جبل الفيل",                   category: "LANDMARK", description: "صخرة بحجم الفيل نحتها الزمن — رمز العلا الأشهر",                                       durationMin: 60,  costEstimate: 0   } });
  const dadanRuins  = await db.attraction.create({ data: { areaId: dadanArea.id,     name: "ديدان — عاصمة اللحيانيين",   category: "LANDMARK", description: "عاصمة مملكة ديدان ثم اللحيانيين: معابد ومقابر تمتد ٣٠٠٠ سنة",                          durationMin: 120, costEstimate: 75  } });
  const ikmaAttr    = await db.attraction.create({ data: { areaId: jIkmahArea.id,    name: "جبل إكمه — المكتبة الصخرية", category: "LANDMARK", description: "أكثر من ٥٠٠ نقش بالنبطية واللحيانية — أكبر تجمع نقوش أثرية في المنطقة",               durationMin: 120, costEstimate: 60  } });
  const gharameelAt = await db.attraction.create({ data: { areaId: gharameelArea.id, name: "الغريميل — متاهة الصخور",     category: "LANDMARK", description: "تكوينات صخرية طبيعية بأشكال خيالية — أفضل للصور عند الشروق والغروب",                  durationMin: 120, costEstimate: 45  } });
  const oldTownAlAt = await db.attraction.create({ data: { areaId: oldTownAl.id,     name: "البلدة القديمة وطريق البخور", category: "LANDMARK", description: "٩٠٠ منزل طيني متلاصق عمرها ٨٠٠ سنة على طريق البخور التاريخي",                        durationMin: 90,  costEstimate: 30  } });
  const khurayba    = await db.attraction.create({ data: { areaId: dadanArea.id,     name: "الخريبة — مقابر الأسد",       category: "LANDMARK", description: "تماثيل أسود محفورة في الجرف فوق مقابر اللحيانيين — فريدة في العالم",                  durationMin: 90,  costEstimate: 60  } });

  // ── معالم أبها ───────────────────────────────────────────────
  const telferik    = await db.attraction.create({ data: { areaId: abhaDown.id,   name: "تلفريك أبها",                    category: "ACTIVITY", description: "كابل من قلعة أبها ينزل ٣ كم فوق الأودية الخضراء — أطول تلفريك في المملكة",          durationMin: 90,  costEstimate: 50  } });
  const abhaFort    = await db.attraction.create({ data: { areaId: abhaDown.id,   name: "قلعة أبها التاريخية",            category: "LANDMARK", description: "قلعة عثمانية تتوسط المدينة — تُشرف على الأودية وتروي تاريخ عسير",                     durationMin: 60,  costEstimate: 0   } });
  const soudaTop    = await db.attraction.create({ data: { areaId: soudasArea.id, name: "منتزه السودة",                   category: "PARK",     description: "ارتفاع ٣٠١٥ م — تلفريك وحدائق وإطلالات فوق الغيوم",                                   durationMin: 180, costEstimate: 30  } });
  const habalaVil   = await db.attraction.create({ data: { areaId: habalaArea.id, name: "قرية الحبالة المعلقة",           category: "LANDMARK", description: "قرية بُنيت على جرف رأسي ارتفاعه ٣٠٠ م — يصلها تلفريك حديث",                          durationMin: 150, costEstimate: 60  } });
  const qabilVil    = await db.attraction.create({ data: { areaId: alqabilArea.id,name: "قرية القابل الأثرية",            category: "LANDMARK", description: "قرية طينية بعمارة عسيرية أصيلة محاطة بالزراعات المدرجة",                              durationMin: 90,  costEstimate: 20  } });
  const rijalAlmaAt = await db.attraction.create({ data: { areaId: rijalArea.id,  name: "قرية رجال ألمع",                 category: "LANDMARK", description: "القرية الأثرية الأشهر في عسير — منازل حجرية بطراز هندسي فريد",                        durationMin: 150, costEstimate: 25  } });
  const shadaPalace = await db.attraction.create({ data: { areaId: abhaDown.id,   name: "قصر شدا الملكي",                 category: "LANDMARK", description: "قصر الملك عبدالعزيز في أبها — تحوّل لمتحف يُطل على المدينة",                          durationMin: 60,  costEstimate: 20  } });

  // ── Tour programs ─────────────────────────────────────────────
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
    ownerAgentId?: string;
    isApproved?: boolean;
    days: DaySeed[];
  }) {
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
        isApproved: opts.isApproved ?? true,
        featured: opts.featured ?? false,
        destinationId: opts.destinationId,
        ownerAgentId: opts.ownerAgentId ?? null,
        tourType: opts.tourType,
        durationDays: opts.durationDays,
        inclusions: opts.inclusions.join("\n"),
        exclusions: opts.exclusions.join("\n"),
      },
    });
    for (const [dayIndex, day] of opts.days.entries()) {
      const createdDay = await db.itineraryDay.create({
        data: {
          programId: program.id,
          dayNumber: dayIndex + 1,
          title: day.title,
          description: day.description,
        },
      });
      for (const [itemIndex, item] of day.items.entries()) {
        await db.itineraryItem.create({
          data: { dayId: createdDay.id, sortOrder: itemIndex + 1, ...item },
        });
      }
    }
    return program;
  }

  const riyadhTour = await createTour({
    slug: "discover-riyadh-diriyah",
    title: "اكتشف الرياض والدرعية",
    summary: "يومان في قلب العاصمة: تاريخ الدرعية وحاضر البوليفارد.",
    description:
      "برنامج مكثف يجمع عبق التاريخ في حي طريف وروح العصر في وجهات الرياض الحديثة، بمرشد سياحي وتنقلات خاصة.",
    coverImage: "/images/riyadh.svg",
    tourType: "DOMESTIC",
    destinationId: saudi.id,
    basePrice: 1450,
    durationDays: 2,
    featured: true,
    inclusions: ["الإقامة بفندق ٤ نجوم مع الإفطار", "التنقلات الداخلية بسيارة خاصة", "مرشد سياحي", "تذاكر الدخول للمواقع"],
    exclusions: ["تذاكر الطيران الداخلي", "وجبات الغداء والعشاء", "المصروفات الشخصية"],
    days: [
      {
        title: "الوصول وجولة الدرعية",
        description: "استقبال ثم أمسية تراثية في الدرعية التاريخية",
        items: [
          { type: "TRANSPORT", title: "الاستقبال من المطار والتوجه للفندق", startTime: "14:00", durationMin: 60, areaId: riyadhCity.id },
          { type: "HOTEL", title: "تسجيل الدخول في الفندق", startTime: "15:30", areaId: riyadhCity.id },
          { type: "ACTIVITY", title: "جولة حي طريف التاريخي", startTime: "17:00", durationMin: 150, areaId: diriyah.id, attractionId: turaif.id },
          { type: "MEAL", title: "عشاء في مطاعم البجيري", startTime: "20:00", durationMin: 90, areaId: diriyah.id },
        ],
      },
      {
        title: "متاحف العاصمة وبوليفارد",
        items: [
          { type: "MEAL", title: "إفطار في الفندق", startTime: "08:30", durationMin: 60 },
          { type: "ACTIVITY", title: "زيارة المتحف الوطني", startTime: "10:00", durationMin: 120, areaId: riyadhCity.id, attractionId: nationalMuseum.id },
          { type: "FREE_TIME", title: "وقت حر للتسوق", startTime: "13:00", durationMin: 120, areaId: riyadhCity.id },
          { type: "ACTIVITY", title: "أمسية بوليفارد رياض سيتي", startTime: "17:00", durationMin: 180, areaId: riyadhCity.id, attractionId: boulevard.id },
          { type: "TRANSPORT", title: "التوصيل للمطار", startTime: "21:30", durationMin: 60 },
        ],
      },
    ],
  });

  const alulaTour = await createTour({
    slug: "alula-magic",
    title: "سحر العلا",
    summary: "٣ أيام بين مدائن صالح وجبل الفيل وسماء لا تشبه غيرها.",
    description:
      "وجهة استثنائية على قائمة التراث العالمي: مواقع أثرية بعمر آلاف السنين، تجارب صحراوية، وأمسيات تحت النجوم.",
    coverImage: "/images/alula.svg",
    tourType: "DOMESTIC",
    destinationId: saudi.id,
    basePrice: 3200,
    durationDays: 3,
    featured: true,
    inclusions: ["الإقامة منتجع صحراوي", "تذاكر مدائن صالح", "جولات بمركبات مكيفة", "إفطار وعشاء يومي"],
    exclusions: ["الطيران من وإلى العلا", "التجارب الاختيارية (منطاد، دراجات)"],
    days: [
      {
        title: "الوصول وأمسية البلدة القديمة",
        items: [
          { type: "FLIGHT", title: "الوصول إلى مطار العلا", startTime: "13:00", areaId: alula.id },
          { type: "HOTEL", title: "تسجيل الدخول في المنتجع", startTime: "15:00", areaId: alula.id },
          { type: "ACTIVITY", title: "جولة طريق البخور والبلدة القديمة", startTime: "17:30", durationMin: 150, areaId: alula.id },
          { type: "MEAL", title: "عشاء بنكهة محلية", startTime: "20:30", durationMin: 90 },
        ],
      },
      {
        title: "مدائن صالح",
        description: "يوم كامل في الحِجر — أول مواقع المملكة على قائمة اليونسكو",
        items: [
          { type: "ACTIVITY", title: "جولة مدائن صالح (الحِجر)", startTime: "09:00", durationMin: 240, areaId: alula.id, attractionId: hegra.id },
          { type: "MEAL", title: "غداء في الموقع", startTime: "13:30", durationMin: 60 },
          { type: "ACTIVITY", title: "جبل الفيل وقت الغروب", startTime: "16:30", durationMin: 120, areaId: alula.id },
        ],
      },
      {
        title: "تجارب حرة والمغادرة",
        items: [
          { type: "FREE_TIME", title: "صباح حر — تجارب اختيارية", startTime: "09:00", durationMin: 180 },
          { type: "TRANSPORT", title: "التوصيل للمطار", startTime: "13:00", durationMin: 45 },
        ],
      },
    ],
  });

  const istanbulTour = await createTour({
    slug: "istanbul-north-turkey",
    title: "إسطنبول والشمال التركي",
    summary: "٧ أيام بين أيقونات إسطنبول وطبيعة طرابزون وأوزنجول.",
    description:
      "البرنامج الأكثر طلباً للعائلات: ثلاث ليالٍ في إسطنبول وثلاث في الشمال مع سائق خاص ومرشد عربي.",
    coverImage: "/images/istanbul.svg",
    tourType: "INTERNATIONAL",
    destinationId: turkey.id,
    basePrice: 4900,
    durationDays: 7,
    featured: true,
    inclusions: ["الإقامة ٦ ليالٍ مع الإفطار", "استقبال وتوديع المطار", "سيارة خاصة مع سائق", "جولات يومية بمرشد عربي"],
    exclusions: ["تذاكر الطيران الدولي", "وجبات الغداء والعشاء", "تذاكر الدخول غير المذكورة"],
    days: [
      {
        title: "الوصول إلى إسطنبول",
        items: [
          { type: "FLIGHT", title: "الوصول لمطار إسطنبول الجديد", startTime: "15:00", areaId: istanbul.id },
          { type: "TRANSPORT", title: "الاستقبال والتوجه للفندق", startTime: "16:00", durationMin: 60, areaId: istanbul.id },
          { type: "HOTEL", title: "تسجيل الدخول — منطقة تقسيم", startTime: "17:30", areaId: istanbul.id },
          { type: "FREE_TIME", title: "أمسية حرة في شارع الاستقلال", startTime: "19:00", areaId: istanbul.id },
        ],
      },
      {
        title: "السلطان أحمد التاريخية",
        items: [
          { type: "ACTIVITY", title: "آيا صوفيا", startTime: "09:30", durationMin: 90, areaId: istanbul.id, attractionId: hagiaSophia.id },
          { type: "ACTIVITY", title: "الجامع الأزرق وميدان السلطان أحمد", startTime: "11:30", durationMin: 60, areaId: istanbul.id, attractionId: blueMosque.id },
          { type: "MEAL", title: "غداء تركي تقليدي", startTime: "13:00", durationMin: 90 },
          { type: "ACTIVITY", title: "السوق المسقوف (جراند بازار)", startTime: "15:00", durationMin: 120, areaId: istanbul.id },
        ],
      },
      {
        title: "البوسفور وقصر دولمة بهجة",
        items: [
          { type: "ACTIVITY", title: "جولة البوسفور البحرية", startTime: "10:30", durationMin: 120, areaId: istanbul.id, attractionId: bosphorus.id },
          { type: "MEAL", title: "غداء على ضفاف البوسفور", startTime: "13:00", durationMin: 90 },
          { type: "FREE_TIME", title: "أمسية حرة وتسوق", startTime: "16:00", areaId: istanbul.id },
        ],
      },
      {
        title: "الطيران إلى طرابزون",
        items: [
          { type: "FLIGHT", title: "رحلة داخلية إلى طرابزون", startTime: "11:00", durationMin: 110, areaId: trabzon.id },
          { type: "HOTEL", title: "تسجيل الدخول في الفندق", startTime: "14:00", areaId: trabzon.id },
          { type: "ACTIVITY", title: "جولة الكورنيش ومغارة تشال", startTime: "16:00", durationMin: 150, areaId: trabzon.id },
        ],
      },
      {
        title: "أوزنجول",
        description: "يوم كامل في أشهر بحيرات الشمال",
        items: [
          { type: "TRANSPORT", title: "الانطلاق إلى أوزنجول", startTime: "09:00", durationMin: 90, areaId: uzungol.id },
          { type: "ACTIVITY", title: "بحيرة أوزنجول والمشي حول البحيرة", startTime: "11:00", durationMin: 180, areaId: uzungol.id, attractionId: uzungolLake.id },
          { type: "MEAL", title: "غداء سمك السلمون المشوي", startTime: "14:00", durationMin: 90 },
          { type: "TRANSPORT", title: "العودة لطرابزون", startTime: "17:00", durationMin: 90 },
        ],
      },
      {
        title: "مرتفعات السلطان مراد",
        items: [
          { type: "ACTIVITY", title: "مرتفعات السلطان مراد فوق الغيوم", startTime: "09:30", durationMin: 240, areaId: trabzon.id, attractionId: sultanMurad.id },
          { type: "MEAL", title: "إفطار قروي على المرتفعات", startTime: "11:00", durationMin: 90 },
          { type: "FREE_TIME", title: "أمسية حرة في طرابزون", startTime: "17:00" },
        ],
      },
      {
        title: "المغادرة",
        items: [
          { type: "TRANSPORT", title: "التوصيل لمطار طرابزون", startTime: "10:00", durationMin: 45 },
          { type: "FLIGHT", title: "المغادرة عبر إسطنبول", startTime: "13:00" },
        ],
      },
    ],
  });

  await createTour({
    slug: "green-georgia",
    title: "جورجيا الخضراء",
    summary: "٦ أيام بين تبليسي وباتومي وجبال القوقاز.",
    description:
      "طبيعة القوقاز وضيافة الجورجيين: مدينة قديمة ساحرة، شلالات، وتلفريك فوق الأخضر الممتد.",
    coverImage: "/images/georgia-tour.svg",
    tourType: "INTERNATIONAL",
    destinationId: georgia.id,
    basePrice: 3750,
    durationDays: 6,
    inclusions: ["الإقامة ٥ ليالٍ مع الإفطار", "سيارة خاصة مع سائق", "جولات بمرشد عربي"],
    exclusions: ["تذاكر الطيران", "وجبات الغداء والعشاء"],
    days: [
      {
        title: "الوصول إلى تبليسي",
        items: [
          { type: "FLIGHT", title: "الوصول لمطار تبليسي", startTime: "14:00", areaId: tbilisi.id },
          { type: "HOTEL", title: "تسجيل الدخول", startTime: "16:00", areaId: tbilisi.id },
          { type: "ACTIVITY", title: "مساء في شارع روستافيلي", startTime: "18:30", durationMin: 120, areaId: tbilisi.id },
        ],
      },
      {
        title: "تبليسي القديمة",
        items: [
          { type: "ACTIVITY", title: "البلدة القديمة وقلعة ناريكالا والتلفريك", startTime: "10:00", durationMin: 180, areaId: tbilisi.id, attractionId: oldTbilisi.id },
          { type: "MEAL", title: "غداء جورجي (خينكالي وخاتشابوري)", startTime: "13:30", durationMin: 90 },
          { type: "ACTIVITY", title: "جسر السلام ونهر كورا", startTime: "16:00", durationMin: 90, areaId: tbilisi.id },
        ],
      },
      {
        title: "الانتقال إلى باتومي",
        items: [
          { type: "TRANSPORT", title: "الطريق البري إلى باتومي", startTime: "09:00", durationMin: 330, areaId: batumi.id },
          { type: "HOTEL", title: "تسجيل الدخول بإطلالة بحرية", startTime: "15:00", areaId: batumi.id },
          { type: "ACTIVITY", title: "كورنيش باتومي مساءً", startTime: "18:00", durationMin: 120, areaId: batumi.id, attractionId: batumiBlvd.id },
        ],
      },
      {
        title: "باتومي والحديقة النباتية",
        items: [
          { type: "ACTIVITY", title: "الحديقة النباتية", startTime: "10:00", durationMin: 150, areaId: batumi.id, attractionId: botanicalGarden.id },
          { type: "FREE_TIME", title: "شاطئ ووقت حر", startTime: "14:00", durationMin: 180, areaId: batumi.id },
        ],
      },
      {
        title: "العودة لتبليسي وشلال مارتفيلي",
        items: [
          { type: "TRANSPORT", title: "طريق العودة مع توقف الشلالات", startTime: "09:00", durationMin: 360, areaId: tbilisi.id },
          { type: "HOTEL", title: "ليلة أخيرة في تبليسي", startTime: "17:00", areaId: tbilisi.id },
        ],
      },
      {
        title: "المغادرة",
        items: [
          { type: "TRANSPORT", title: "التوصيل للمطار", startTime: "11:00", durationMin: 40 },
          { type: "FLIGHT", title: "المغادرة", startTime: "14:00" },
        ],
      },
    ],
  });

  // Agent-owned program awaiting admin approval (moderation demo).
  const agentTour = await createTour({
    slug: "family-trabzon",
    title: "طرابزون العائلية",
    summary: "٥ أيام مصممة للعائلات في الشمال التركي بإيقاع هادئ.",
    description:
      "برنامج من إعداد وكيلنا أحمد: فنادق عائلية، مسافات قصيرة، ووقت حر أكثر — مثالي للأطفال وكبار السن.",
    coverImage: "/images/trabzon.svg",
    tourType: "INTERNATIONAL",
    destinationId: turkey.id,
    basePrice: 3300,
    durationDays: 5,
    ownerAgentId: agent.id,
    isApproved: false,
    inclusions: ["الإقامة ٤ ليالٍ", "سيارة عائلية مع سائق", "استقبال وتوديع"],
    exclusions: ["الطيران", "الوجبات"],
    days: [
      {
        title: "الوصول",
        items: [
          { type: "FLIGHT", title: "الوصول لمطار طرابزون", startTime: "13:00", areaId: trabzon.id },
          { type: "HOTEL", title: "تسجيل الدخول", startTime: "15:00", areaId: trabzon.id },
        ],
      },
      {
        title: "أوزنجول بهدوء",
        items: [
          { type: "ACTIVITY", title: "يوم كامل في أوزنجول", startTime: "10:00", durationMin: 300, areaId: uzungol.id, attractionId: uzungolLake.id },
        ],
      },
      {
        title: "مرتفعات السلطان مراد",
        items: [
          { type: "ACTIVITY", title: "السلطان مراد", startTime: "09:30", durationMin: 240, areaId: trabzon.id, attractionId: sultanMurad.id },
        ],
      },
      {
        title: "يوم حر",
        items: [
          { type: "FREE_TIME", title: "تسوق ووقت عائلي", startTime: "11:00", areaId: trabzon.id },
        ],
      },
      {
        title: "المغادرة",
        items: [{ type: "TRANSPORT", title: "التوصيل للمطار", startTime: "10:00" }],
      },
    ],
  });

  // ── Study programs ────────────────────────────────────────────
  const londonLang = await db.program.create({
    data: {
      slug: "london-english-12w",
      title: "دورة لغة إنجليزية في لندن — ١٢ أسبوعاً",
      category: "STUDY",
      summary: "قبول سريع في معهد EC London مع سكن قريب ومتابعة كاملة.",
      description:
        "برنامج لغة مكثف (٢٠ حصة أسبوعياً) يناسب المبتدئين والمتوسطين، مع اختبار تحديد مستوى وشهادة معتمدة في النهاية.",
      coverImage: "/images/london-lang.svg",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isApproved: true,
      featured: true,
      destinationId: uk.id,
      studyKind: "LANGUAGE",
      institute: "EC London",
      studyCity: "لندن",
      durationWeeks: 12,
      tuitionMin: 18000,
      tuitionMax: 24000,
      requirements: ["جواز سفر ساري المفعول", "كشف حساب بنكي", "تعبئة نموذج التسجيل"].join("\n"),
      servicesIncluded: [
        "خطاب القبول من المعهد",
        "حجز السكن (عائلة أو سكن طلابي)",
        "دعم ملف التأشيرة",
        "الاستقبال من المطار",
        "متابعة أسبوعية طوال الدراسة",
      ].join("\n"),
    },
  });

  await db.program.create({
    data: {
      slug: "manchester-foundation",
      title: "السنة التحضيرية في مانشستر",
      category: "STUDY",
      summary: "بوابة القبول الجامعي في بريطانيا لطلاب الابتعاث.",
      description:
        "برنامج تحضيري معترف به لدى الجامعات البريطانية، يشمل اللغة الأكاديمية ومهارات الدراسة والتخصص التمهيدي.",
      coverImage: "/images/manchester.svg",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isApproved: true,
      destinationId: uk.id,
      studyKind: "UNIVERSITY",
      institute: "INTO Manchester",
      studyCity: "مانشستر",
      durationWeeks: 36,
      tuitionMin: 85000,
      tuitionMax: 110000,
      requirements: [
        "شهادة الثانوية بمعدل جيد جداً فأعلى",
        "IELTS 5.5 أو اختبار المعهد",
        "جواز سفر ساري",
      ].join("\n"),
      servicesIncluded: [
        "القبول الجامعي المشروط",
        "تجهيز ملف الابتعاث",
        "دعم التأشيرة الدراسية",
        "تأمين السكن الطلابي",
      ].join("\n"),
    },
  });

  await db.program.create({
    data: {
      slug: "london-summer-english",
      title: "برنامج صيفي للغة في لندن",
      category: "STUDY",
      summary: "٤ أسابيع لغة + أنشطة سياحية — مثالي للطلاب في الإجازة.",
      description:
        "ادرس صباحاً واستكشف لندن مساءً مع مجموعات شبابية وأنشطة منظمة على مدار الأسبوع.",
      coverImage: "/images/london-summer.svg",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isApproved: true,
      destinationId: uk.id,
      studyKind: "LANGUAGE",
      institute: "Kaplan London",
      studyCity: "لندن",
      durationWeeks: 4,
      tuitionMin: 9500,
      tuitionMax: 12500,
      requirements: ["العمر ١٦ سنة فأعلى", "جواز سفر ساري"].join("\n"),
      servicesIncluded: ["القبول", "السكن مع عائلة", "الاستقبال", "بطاقة المواصلات"].join("\n"),
    },
  });

  await db.program.create({
    data: {
      slug: "edinburgh-english-8w",
      title: "دورة اللغة الإنجليزية — إدنبرة",
      category: "STUDY",
      summary: "٨ أسابيع في قلب إدنبرة التاريخية مع معهد ESE Edinburgh.",
      description:
        "برنامج لغة إنجليزية مكثف (٢٠ حصة أسبوعياً) في عاصمة اسكتلندا، يجمع بين الدراسة واستكشاف التراث الأوروبي. يناسب المستويات من المبتدئ حتى المتقدم مع اختبار تحديد مستوى عند الوصول.",
      coverImage: "/images/edinburgh.svg",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isApproved: true,
      featured: true,
      destinationId: edinburgh.id,
      studyKind: "LANGUAGE",
      institute: "ESE Edinburgh",
      studyCity: "إدنبرة",
      durationWeeks: 8,
      tuitionMin: 14000,
      tuitionMax: 19000,
      basePrice: 16000,
      requirements: ["جواز سفر ساري المفعول", "كشف حساب بنكي", "تعبئة نموذج التسجيل"].join("\n"),
      servicesIncluded: [
        "خطاب القبول من المعهد",
        "دعم ملف التأشيرة البريطانية",
        "حجز السكن (عائلة مضيفة أو سكن مشترك)",
        "الاستقبال من مطار إدنبرة",
        "متابعة أسبوعية طوال مدة الدراسة",
        "شهادة إتمام معتمدة",
      ].join("\n"),
    },
  });

  await db.program.create({
    data: {
      slug: "canada-scholarship-2026",
      title: "ابتعاث كندا 2026 — بكالوريوس وماجستير",
      category: "STUDY",
      summary: "مسار متكامل للابتعاث الحكومي والذاتي في الجامعات الكندية.",
      description:
        "نقدم مسارين: الابتعاث الحكومي (خادم الحرمين) والتسجيل الذاتي في جامعات كندية معترف بها. يشمل البرنامج تقييم الملف الأكاديمي، اختيار الجامعة، تجهيز طلبات القبول، دعم قبول اللغة (IELTS/TOEFL)، والتأشيرة الدراسية.",
      coverImage: "/images/canada.svg",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isApproved: true,
      studyKind: "SCHOLARSHIP",
      studyCity: "تورنتو / فانكوفر / أوتاوا",
      durationWeeks: 156,
      tuitionMin: 60000,
      tuitionMax: 150000,
      requirements: [
        "شهادة ثانوية أو بكالوريوس (حسب المرحلة)",
        "معدل جيد جداً فأعلى",
        "شهادة لغة IELTS 6.0 أو ما يعادلها",
        "جواز سفر ساري لمدة ٥ سنوات",
      ].join("\n"),
      servicesIncluded: [
        "تقييم الملف الأكاديمي مجاناً",
        "اختيار الجامعة والتخصص",
        "تجهيز ٣ طلبات قبول",
        "دعم ملف التأشيرة الدراسية (Student Visa)",
        "التنسيق مع مكتب الابتعاث (إن وُجد)",
        "متابعة القبول حتى الوصول",
      ].join("\n"),
    },
  });

  // ── Providers & drivers ───────────────────────────────────────
  const masarTransport = await db.serviceProvider.create({
    data: {
      name: "شركة المسار للنقل السياحي",
      type: "TRANSPORT",
      contactName: "م. خالد",
      phone: "0556667777",
      city: "الرياض",
      notes: "أسطول فانات حديثة — تعاقد سنوي",
    },
  });
  await db.serviceProvider.create({
    data: {
      name: "فندق روز بارك",
      type: "HOTEL",
      contactName: "قسم الحجوزات",
      phone: "0118887777",
      city: "الرياض",
    },
  });
  await db.serviceProvider.create({
    data: {
      name: "منسق رحلات تبليسي",
      type: "OTHER",
      contactName: "جورجي",
      phone: "+995599112233",
      city: "تبليسي",
      notes: "تنسيق الجولات والسائقين في جورجيا",
    },
  });

  const driverSaad = await db.driver.create({
    data: {
      name: "سعد العتيبي",
      phone: "0501234567",
      city: "الرياض",
      vehicleType: "جمس يوكن",
      vehiclePlate: "أ ب ج 1234",
      capacity: 6,
    },
  });
  await db.driver.create({
    data: {
      name: "فهد القحطاني",
      phone: "0507654321",
      city: "جدة",
      vehicleType: "فان ٧ ركاب",
      vehiclePlate: "د هـ و 5678",
      capacity: 7,
      providerId: masarTransport.id,
    },
  });
  await db.driver.create({
    data: {
      name: "Mehmet Yilmaz",
      phone: "+905301112233",
      city: "إسطنبول",
      vehicleType: "فيتو VIP",
      capacity: 6,
      notes: "سائق خطار المعتمد في إسطنبول — يتحدث العربية",
    },
  });

  // ── برنامج إدنبرة ٧ أيام ─────────────────────────────────────
  await createTour({
    slug: "edinburgh-7-days",
    title: "إدنبرة — تجربة اسكتلندا الكاملة",
    summary: "٧ أيام في أجمل مدينة في أوروبا: قلاع وقصور وطبيعة جبلية داخل المدينة.",
    description:
      "إدنبرة ليست مجرد مدينة — هي تجربة حضارية فريدة. من القلعة العريقة إلى عرش أرثر، " +
      "ومن قصر هوليرود الملكي إلى ميناء ليث الفني. متاحف مجانية بمستوى عالمي، مطاعم اسكتلندية أصيلة، " +
      "وأجواء ترفع الروح في كل حارة وشارع.",
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
      "رحلة يومية بالباص إلى Loch Lomond وقلعة Stirling",
    ],
    exclusions: [
      "تذاكر الطيران الدولي",
      "وجبات الغداء والعشاء",
      "التأشيرة البريطانية",
      "التأمين على السفر",
    ],
    days: [
      {
        title: "الوصول واستكشاف الطريق الملكي",
        description: "أول لمسة لإدنبرة: الفندق في قلب المدينة القديمة والطريق الملكي مساءً",
        items: [
          { type: "FLIGHT",    title: "الوصول لمطار إدنبرة",                              startTime: "13:00", areaId: edinCity.id },
          { type: "TRANSPORT", title: "الاستقبال والتوجه للفندق بسيارة خاصة",             startTime: "14:00", durationMin: 30,  areaId: oldTown.id },
          { type: "HOTEL",     title: "تسجيل الدخول — فندق في المدينة القديمة",           startTime: "15:00", durationMin: 60,  areaId: oldTown.id },
          { type: "ACTIVITY",  title: "مشي استكشافي في الطريق الملكي",                    startTime: "17:00", durationMin: 90,  areaId: oldTown.id, attractionId: royalMile.id, notes: "راقب الموسيقيين الاسكتلنديين وتصفح المحلات" },
          { type: "MEAL",      title: "عشاء في أحد مطاعم Old Town",                       startTime: "19:30", durationMin: 90,  areaId: oldTown.id },
        ],
      },
      {
        title: "قلعة إدنبرة والمتحف الوطني",
        description: "يوم التاريخ الكامل — القلعة صباحاً والمتحف المجاني بعد الظهر",
        items: [
          { type: "MEAL",      title: "إفطار اسكتلندي في الفندق",                          startTime: "08:00", durationMin: 60 },
          { type: "ACTIVITY",  title: "قلعة إدنبرة — التاجان الملكيان ومدفع الساعة",      startTime: "09:30", durationMin: 150, areaId: oldTown.id, attractionId: edinCastle.id, notes: "احجز التذكرة مسبقاً" },
          { type: "MEAL",      title: "غداء خفيف قرب القلعة",                             startTime: "12:30", durationMin: 60,  areaId: oldTown.id },
          { type: "ACTIVITY",  title: "المتحف الوطني الاسكتلندي — مجاني",                 startTime: "14:00", durationMin: 150, areaId: oldTown.id, attractionId: scotMuseum.id },
          { type: "ACTIVITY",  title: "سوق غراسماركيت والحارات القديمة",                  startTime: "17:30", durationMin: 90,  areaId: oldTown.id, attractionId: grassmkt.id },
          { type: "MEAL",      title: "عشاء في غراسماركيت",                                startTime: "20:00", durationMin: 90,  areaId: oldTown.id },
        ],
      },
      {
        title: "قصر هوليرود وعرش أرثر",
        description: "القصر الملكي ثم تسلق القمة البركانية بداخل المدينة",
        items: [
          { type: "MEAL",      title: "إفطار في الفندق",                                   startTime: "08:00", durationMin: 60 },
          { type: "ACTIVITY",  title: "قصر هوليرود — الجولة المسموعة بالعربي",             startTime: "09:30", durationMin: 120, areaId: holyrood.id, attractionId: holyroodPal.id },
          { type: "MEAL",      title: "غداء في كافيه البرلمان الاسكتلندي",                startTime: "12:00", durationMin: 60,  areaId: holyrood.id },
          { type: "ACTIVITY",  title: "تسلق عرش أرثر — أفضل بانوراما لإدنبرة",           startTime: "14:00", durationMin: 150, areaId: holyrood.id, attractionId: arthurSeat.id, notes: "ارتدِ حذاءً مريحاً — الصعود سهل ومكافأته رهيبة" },
          { type: "FREE_TIME", title: "وقت حر في Holyrood Park",                           startTime: "17:00", durationMin: 60,  areaId: holyrood.id },
          { type: "MEAL",      title: "عشاء في المدينة القديمة",                            startTime: "20:00", durationMin: 90,  areaId: oldTown.id },
        ],
      },
      {
        title: "المدينة الجديدة — الحدائق والبوتانيكال",
        description: "المعمار الجورجي وحدائق ملكية وتجربة الويسكي الاسكتلندي",
        items: [
          { type: "MEAL",      title: "إفطار في الفندق",                                   startTime: "08:00", durationMin: 60 },
          { type: "ACTIVITY",  title: "حدائق برينسيز ستريت — صورة القلعة الأيقونية",      startTime: "09:30", durationMin: 60,  areaId: newTown.id, attractionId: princesGard.id },
          { type: "ACTIVITY",  title: "الحديقة النباتية الملكية — مجانية",                startTime: "11:00", durationMin: 90,  areaId: newTown.id, attractionId: botGardenEd.id },
          { type: "MEAL",      title: "غداء على شارع George St",                          startTime: "13:00", durationMin: 75,  areaId: newTown.id },
          { type: "ACTIVITY",  title: "تجربة الويسكي الاسكتلندي — جولة تفاعلية",         startTime: "15:00", durationMin: 90,  areaId: oldTown.id, attractionId: whiskyExp.id },
          { type: "FREE_TIME", title: "تسوق في Princes Street",                            startTime: "17:00", durationMin: 120, areaId: newTown.id },
          { type: "MEAL",      title: "عشاء في المدينة الجديدة",                            startTime: "20:00", durationMin: 90,  areaId: newTown.id },
        ],
      },
      {
        title: "رحلة يومية — Loch Lomond وقلعة Stirling",
        description: "خروج من المدينة نحو الطبيعة الاسكتلندية الساحرة",
        items: [
          { type: "MEAL",      title: "إفطار مبكر في الفندق",                              startTime: "07:30", durationMin: 45 },
          { type: "TRANSPORT", title: "باص مجموعة إلى Loch Lomond",                        startTime: "08:30", durationMin: 90,  areaId: edinCity.id },
          { type: "ACTIVITY",  title: "بحيرة Loch Lomond — أولى بحيرات الهايلاندز",      startTime: "10:30", durationMin: 120, notes: "جولة بحرية اختيارية أو مشي على الشاطئ" },
          { type: "MEAL",      title: "غداء في قرية Luss التاريخية",                      startTime: "13:00", durationMin: 75 },
          { type: "ACTIVITY",  title: "قلعة Stirling — قلعة ماري ملكة اسكتلندا",         startTime: "15:30", durationMin: 120, notes: "توقف على الطريق للعودة" },
          { type: "TRANSPORT", title: "العودة إلى إدنبرة",                                 startTime: "18:30", durationMin: 90,  areaId: edinCity.id },
          { type: "MEAL",      title: "عشاء في المدينة القديمة",                            startTime: "20:30", durationMin: 90,  areaId: oldTown.id },
        ],
      },
      {
        title: "ليث وتل كالتون",
        description: "حي الميناء الفني واليخت الملكي وأجمل غروب في المدينة",
        items: [
          { type: "MEAL",      title: "إفطار في الفندق",                                   startTime: "08:30", durationMin: 60 },
          { type: "ACTIVITY",  title: "اليخت الملكي برتانيا في ميناء ليث",                startTime: "10:00", durationMin: 120, areaId: leith.id, attractionId: royalBrit.id },
          { type: "MEAL",      title: "غداء مأكولات بحرية في ليث",                        startTime: "13:00", durationMin: 75,  areaId: leith.id },
          { type: "FREE_TIME", title: "استكشاف حي ليث الفني",                              startTime: "15:00", durationMin: 90,  areaId: leith.id },
          { type: "ACTIVITY",  title: "تل كالتون — غروب الشمس فوق المدينة",               startTime: "18:00", durationMin: 90,  areaId: newTown.id, attractionId: caltonHill.id, notes: "الغروب في الصيف بعد ٢١:٠٠ — تجربة لا تُنسى" },
          { type: "MEAL",      title: "عشاء أخير في إدنبرة",                               startTime: "21:00", durationMin: 90,  areaId: oldTown.id },
        ],
      },
      {
        title: "المغادرة",
        description: "تسوق أخير ثم وداع إدنبرة",
        items: [
          { type: "MEAL",      title: "إفطار في الفندق",                                   startTime: "08:00", durationMin: 60 },
          { type: "FREE_TIME", title: "تسوق أخير — هدايا اسكتلندية تذكارية",              startTime: "09:30", durationMin: 120, areaId: oldTown.id, notes: "Shortbread، ويسكي، وكيلت — أفضل الهدايا" },
          { type: "HOTEL",     title: "تسجيل الخروج من الفندق",                            startTime: "12:00", durationMin: 30,  areaId: oldTown.id },
          { type: "TRANSPORT", title: "التوصيل لمطار إدنبرة بسيارة خاصة",                 startTime: "13:00", durationMin: 30,  areaId: edinCity.id },
          { type: "FLIGHT",    title: "المغادرة من مطار إدنبرة",                           startTime: "16:00" },
        ],
      },
    ],
  });

  // ── Bookings across the whole pipeline ────────────────────────
  const day = 24 * 60 * 60 * 1000;
  const today = new Date();
  const inDays = (n: number) => new Date(today.getTime() + n * day);

  // 1) NEW from website (no agent)
  await db.bookingRequest.create({
    data: {
      code: "KH-NEW001",
      programId: riyadhTour.id,
      programTitle: riyadhTour.title,
      customerName: "عبدالله الشمري",
      customerPhone: "0561112233",
      adults: 2,
      children: 1,
      preferredDate: inDays(21),
      status: "NEW",
      source: "WEBSITE",
      customerNotes: "نفضل فندقاً قريباً من البوليفارد",
    },
  });

  // 2) NEW via agent referral
  await db.bookingRequest.create({
    data: {
      code: "KH-NEW002",
      programId: istanbulTour.id,
      programTitle: istanbulTour.title,
      customerName: "ريم العنزي",
      customerPhone: "0562223344",
      customerEmail: "reem@example.com",
      adults: 2,
      preferredDate: inDays(35),
      status: "NEW",
      source: "WEBSITE",
      agentId: agent.id,
    },
  });

  // 3) CONTACTED (agent-created)
  await db.bookingRequest.create({
    data: {
      code: "KH-CNT003",
      programId: alulaTour.id,
      programTitle: alulaTour.title,
      customerName: "محمد الدوسري",
      customerPhone: "0563334455",
      adults: 4,
      preferredDate: inDays(28),
      status: "CONTACTED",
      source: "AGENT",
      agentId: agent.id,
      internalNotes: "تم الاتصال — ينتظر موافقة العائلة",
    },
  });

  // 4) QUOTED with price
  await db.bookingRequest.create({
    data: {
      code: "KH-QTD004",
      programId: georgia ? (await db.program.findUnique({ where: { slug: "green-georgia" } }))!.id : null,
      programTitle: "جورجيا الخضراء",
      customerName: "سارة المطيري",
      customerPhone: "0564445566",
      adults: 2,
      preferredDate: inDays(40),
      status: "QUOTED",
      source: "WEBSITE",
      totalPrice: 7500,
      internalNotes: "عرض سعر شامل ترقية الفندق",
    },
  });

  // 5) CONFIRMED with agent → payments + auto-style ledger entries
  const confirmed1 = await db.bookingRequest.create({
    data: {
      code: "KH-CNF005",
      programId: istanbulTour.id,
      programTitle: istanbulTour.title,
      customerName: "خالد الغامدي",
      customerPhone: "0565556677",
      customerEmail: "khaled@example.com",
      adults: 2,
      children: 2,
      preferredDate: inDays(14),
      status: "CONFIRMED",
      source: "WEBSITE",
      agentId: agent.id,
      assignedToId: admin.id,
      totalPrice: 19600,
      confirmedAt: new Date(today.getTime() - 3 * day),
    },
  });
  await db.payment.create({
    data: {
      bookingId: confirmed1.id,
      amount: 19600,
      method: "BANK_TRANSFER",
      reference: "TRF-88421",
      paidAt: new Date(today.getTime() - 2 * day),
      recordedById: admin.id,
    },
  });
  // Ledger entries exactly as setBookingStatus would create them (10% / 5%).
  await db.ledgerEntry.createMany({
    data: [
      {
        agentId: agent.id,
        bookingId: confirmed1.id,
        type: "COMMISSION",
        amount: 1960,
        note: `عمولة حجز ${confirmed1.code}`,
        createdById: admin.id,
        createdAt: new Date(today.getTime() - 3 * day),
      },
      {
        agentId: agent.id,
        bookingId: confirmed1.id,
        type: "PLATFORM_FEE",
        amount: -980,
        note: `رسوم المنصة عن حجز ${confirmed1.code}`,
        createdById: admin.id,
        createdAt: new Date(today.getTime() - 3 * day),
      },
    ],
  });
  // Transfers for the confirmed trip: one assigned, one still requested.
  await db.transfer.create({
    data: {
      bookingId: confirmed1.id,
      date: inDays(14),
      time: "16:00",
      fromLocation: "مطار إسطنبول الجديد",
      toLocation: "فندق تقسيم",
      pax: 4,
      vehicleType: "فيتو VIP",
      driverId: (await db.driver.findFirst({ where: { city: "إسطنبول" } }))!.id,
      status: "ASSIGNED",
      price: 300,
    },
  });
  await db.transfer.create({
    data: {
      bookingId: confirmed1.id,
      date: inDays(18),
      time: "09:00",
      fromLocation: "فندق طرابزون",
      toLocation: "أوزنجول",
      pax: 4,
      status: "REQUESTED",
      notes: "رحلة يوم كامل — يفضل سائق يتحدث العربية",
    },
  });

  // 6) CONFIRMED domestic (no agent) with partial payment + transfer
  const confirmed2 = await db.bookingRequest.create({
    data: {
      code: "KH-CNF006",
      programId: alulaTour.id,
      programTitle: alulaTour.title,
      customerName: "نوف القرني",
      customerPhone: "0566667788",
      adults: 3,
      preferredDate: inDays(10),
      status: "CONFIRMED",
      source: "ADMIN",
      assignedToId: admin.id,
      totalPrice: 9600,
      confirmedAt: new Date(today.getTime() - 1 * day),
    },
  });
  await db.payment.create({
    data: {
      bookingId: confirmed2.id,
      amount: 4800,
      method: "CASH",
      notes: "دفعة مقدمة ٥٠٪",
      paidAt: new Date(today.getTime() - 1 * day),
      recordedById: admin.id,
    },
  });
  await db.transfer.create({
    data: {
      bookingId: confirmed2.id,
      date: inDays(10),
      time: "11:30",
      fromLocation: "مطار العلا",
      toLocation: "منتجع شادن",
      pax: 3,
      vehicleType: "جمس يوكن",
      driverId: driverSaad.id,
      providerId: null,
      status: "ASSIGNED",
      price: 250,
    },
  });

  // 7) COMPLETED study application (agent referral)
  const completed = await db.bookingRequest.create({
    data: {
      code: "KH-CMP007",
      programId: londonLang.id,
      programTitle: londonLang.title,
      customerName: "بدر العتيبي",
      customerPhone: "0567778899",
      customerEmail: "badr@example.com",
      adults: 1,
      preferredDate: new Date(today.getTime() - 30 * day),
      status: "COMPLETED",
      source: "WEBSITE",
      agentId: agent.id,
      totalPrice: 21000,
      confirmedAt: new Date(today.getTime() - 45 * day),
    },
  });
  await db.payment.create({
    data: {
      bookingId: completed.id,
      amount: 21000,
      method: "BANK_TRANSFER",
      reference: "TRF-77110",
      paidAt: new Date(today.getTime() - 44 * day),
      recordedById: admin.id,
    },
  });
  await db.ledgerEntry.createMany({
    data: [
      {
        agentId: agent.id,
        bookingId: completed.id,
        type: "COMMISSION",
        amount: 2100,
        note: `عمولة حجز ${completed.code}`,
        createdById: admin.id,
        createdAt: new Date(today.getTime() - 45 * day),
      },
      {
        agentId: agent.id,
        bookingId: completed.id,
        type: "PLATFORM_FEE",
        amount: -1050,
        note: `رسوم المنصة عن حجز ${completed.code}`,
        createdById: admin.id,
        createdAt: new Date(today.getTime() - 45 * day),
      },
    ],
  });

  // 8) CANCELLED
  await db.bookingRequest.create({
    data: {
      code: "KH-CXL008",
      programId: agentTour.id,
      programTitle: agentTour.title,
      customerName: "فيصل الزهراني",
      customerPhone: "0568889900",
      adults: 5,
      status: "CANCELLED",
      source: "AGENT",
      agentId: agent.id,
      internalNotes: "ألغى العميل لظرف عائلي",
    },
  });

  // Manual ledger entries so the statement shows all four types.
  await db.ledgerEntry.create({
    data: {
      agentId: agent.id,
      type: "PAYOUT",
      amount: -1500,
      note: "تحويل بنكي — دفعة شهر مايو",
      createdById: admin.id,
      createdAt: new Date(today.getTime() - 20 * day),
    },
  });
  await db.ledgerEntry.create({
    data: {
      agentId: agent.id,
      type: "ADJUSTMENT",
      amount: 200,
      note: "مكافأة حملة الصيف",
      createdById: admin.id,
      createdAt: new Date(today.getTime() - 10 * day),
    },
  });

  // ── Site content ──────────────────────────────────────────────
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
      { key: "email", value: "info@khattar.sa" },
      { key: "address", value: "الرياض — طريق الملك فهد" },
      { key: "instagram", value: "khattar.sa" },
      { key: "x", value: "khattar_sa" },
    ],
  });

  await db.testimonial.createMany({
    data: [
      {
        name: "أم فهد",
        role: "رحلة إسطنبول والشمال",
        text: "الجدول كان مرتباً بدقة: السائق في الموعد، والمرشد عرف وش يناسب العيال. أفضل رحلة عائلية لنا.",
        sortOrder: 1,
      },
      {
        name: "بدر العتيبي",
        role: "دورة لغة في لندن",
        text: "من القبول للسكن للاستقبال بالمطار — ما احتجت أراجع أحد غيرهم. متابعتهم الأسبوعية فرقت معي كثير.",
        sortOrder: 2,
      },
      {
        name: "سارة",
        role: "رحلة العلا",
        text: "رابط متابعة الرحلة فكرة عبقرية، كل التفاصيل بجوالي وأعرف جدول كل يوم.",
        sortOrder: 3,
      },
    ],
  });

  await db.agentApplication.createMany({
    data: [
      {
        name: "عمر باوزير",
        email: "omar@example.com",
        phone: "0569990011",
        city: "جدة",
        companyName: "باوزير للسياحة",
        message: "خبرة ٥ سنوات في تنظيم رحلات جنوب شرق آسيا وأرغب بالانضمام لشبكتكم.",
      },
      {
        name: "هند الشهري",
        email: "hind@example.com",
        phone: "0561234987",
        city: "أبها",
        message: "مسوقة رحلات عبر الشبكات الاجتماعية بمتابعين يتجاوزون ٥٠ ألفاً.",
      },
    ],
  });

  await db.contactMessage.createMany({
    data: [
      {
        name: "ماجد",
        phone: "0567891234",
        subject: "برنامج خاص لشهر العسل",
        message: "أبغى برنامج ١٠ أيام جورجيا وتركيا لشخصين نهاية الشهر، كم التكلفة التقريبية؟",
      },
      {
        name: "أبو سلطان",
        phone: "0562228899",
        email: "abusultan@example.com",
        subject: "استفسار ابتعاث",
        message: "ابني حاصل على ٩٢٪ ويرغب بدراسة الهندسة في بريطانيا — وش الخطوات؟",
        isRead: true,
      },
    ],
  });

  // ── Summary ───────────────────────────────────────────────────
  const counts = {
    users: await db.user.count(),
    destinations: await db.destination.count(),
    areas: await db.area.count(),
    attractions: await db.attraction.count(),
    programs: await db.program.count(),
    days: await db.itineraryDay.count(),
    items: await db.itineraryItem.count(),
    bookings: await db.bookingRequest.count(),
    payments: await db.payment.count(),
    transfers: await db.transfer.count(),
    ledger: await db.ledgerEntry.count(),
    drivers: await db.driver.count(),
    providers: await db.serviceProvider.count(),
  };
  console.table(counts);

  console.log(`
✅ تم تجهيز البيانات التجريبية

حسابات الدخول (/login):
  • الإدارة : admin@khattar.sa  /  ${PASSWORD}
  • الوكيل  : agent@khattar.sa  /  ${PASSWORD}   (كود الإحالة AHMED10)

روابط للتجربة:
  • صفحة رحلة عميل (بدون دخول): /b/KH-CNF005
  • حجز عبر إحالة الوكيل: /programs?ref=AHMED10
  • برنامج وكيل بانتظار الموافقة: لوحة الإدارة → البرامج
`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
