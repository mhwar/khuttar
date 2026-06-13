import Link from "next/link";
import {
  ArrowLeftIcon,
  BadgeCheckIcon,
  BedIcon,
  Building2Icon,
  CalendarCheckIcon,
  CalendarRangeIcon,
  CompassIcon,
  GlobeIcon,
  GraduationCapIcon,
  HandshakeIcon,
  HeadsetIcon,
  LanguagesIcon,
  MapPinnedIcon,
  PlaneIcon,
  QuoteIcon,
  RouteIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  StarIcon,
  TicketIcon,
  UtensilsIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSettings, publicProgramWhere } from "@/lib/queries";
import { STUDY_MILESTONE_TEMPLATES } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { ar } from "@/lib/i18n/ar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DestinationCard, ProgramCard } from "@/components/public/cards";
import { HeroSearch } from "@/components/public/hero-search";

// Section title with an optional "view all" link, end-aligned for RTL.
function SectionHeading({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div className="grid gap-1">
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Button variant="ghost" asChild className="text-primary hover:text-primary">
          <Link href={href}>
            {ar.home.viewAll}
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function CenteredHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto mb-10 grid max-w-2xl gap-2 text-center">
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export default async function HomePage() {
  const [
    settings,
    allDestinations,
    tours,
    studies,
    testimonials,
    toursCount,
    studyCount,
    citiesCount,
  ] = await Promise.all([
    getSettings(),
    db.destination.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.program.findMany({
      where: { ...publicProgramWhere, category: "TOUR" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: { destination: { select: { name: true } } },
    }),
    db.program.findMany({
      where: { ...publicProgramWhere, category: "STUDY" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: { destination: { select: { name: true } } },
    }),
    db.testimonial.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      take: 3,
    }),
    db.program.count({ where: { ...publicProgramWhere, category: "TOUR" } }),
    db.program.count({ where: { ...publicProgramWhere, category: "STUDY" } }),
    db.area.count({ where: { kind: "CITY" } }),
  ]);

  const featured = allDestinations.filter((d) => d.featured);
  const featuredDestinations = (featured.length ? featured : allDestinations).slice(0, 8);
  const searchDestinations = allDestinations.map((d) => ({ id: d.id, name: d.name }));

  const stats = [
    { icon: MapPinnedIcon, value: formatNumber(allDestinations.length), label: ar.home.statDestinations },
    { icon: TicketIcon, value: formatNumber(toursCount + studyCount), label: ar.home.statPrograms },
    { icon: Building2Icon, value: formatNumber(citiesCount), label: ar.home.statCities },
    { icon: HeadsetIcon, value: ar.home.statSupportValue, label: ar.home.statSupport, ltr: true },
  ];

  const categories = [
    { icon: CompassIcon, title: ar.home.catDomestic, body: ar.home.catDomesticBody, href: "/programs?type=DOMESTIC", gradient: "from-teal-600 to-teal-800" },
    { icon: PlaneIcon, title: ar.home.catIntl, body: ar.home.catIntlBody, href: "/programs?type=INTERNATIONAL", gradient: "from-primary to-blue-900" },
    { icon: LanguagesIcon, title: ar.home.catLanguage, body: ar.home.catLanguageBody, href: "/study?kind=LANGUAGE", gradient: "from-amber-600 to-orange-700" },
    { icon: GraduationCapIcon, title: ar.home.catUniversity, body: ar.home.catUniversityBody, href: "/study?kind=UNIVERSITY", gradient: "from-indigo-600 to-purple-800" },
  ];

  const steps = [
    { icon: SearchIcon, title: ar.home.step1Title, body: ar.home.step1Body },
    { icon: CalendarCheckIcon, title: ar.home.step2Title, body: ar.home.step2Body },
    { icon: RouteIcon, title: ar.home.step3Title, body: ar.home.step3Body },
  ];

  const features = [
    { icon: CalendarRangeIcon, title: "جداول مصممة بعناية", body: "برامج يومية مفصلة: أنشطة، تنقلات، فنادق ووجبات — تعرف رحلتك قبل أن تبدأ." },
    { icon: GraduationCapIcon, title: "خبرة في القبول والابتعاث", body: "نسهّل إجراءات القبول والسكن والتأشيرة لبرامج اللغة والدراسة بالخارج." },
    { icon: HandshakeIcon, title: "شبكة وكلاء وشركاء", body: "وكلاء معتمدون ومزوّدو نقل وفنادق نتعامل معهم مباشرة لخدمتك أينما كنت." },
    { icon: HeadsetIcon, title: "متابعة طوال الرحلة", body: "رابط متابعة خاص لرحلتك وتنسيق مواصلاتك مع سائقينا أولاً بأول." },
  ];

  const scheduleSample = [
    { icon: PlaneIcon, time: "٨:٠٠", title: "الوصول والاستقبال من المطار" },
    { icon: SparklesIcon, time: "١٠:٣٠", title: "جولة في أبرز المعالم" },
    { icon: UtensilsIcon, time: "١٤:٠٠", title: "غداء في مطعم مميز" },
    { icon: BedIcon, time: "١٨:٠٠", title: "الإقامة والاستراحة بالفندق" },
  ];

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative flex min-h-[88svh] flex-col justify-center overflow-hidden bg-gradient-to-bl from-primary via-primary/95 to-teal-900 text-primary-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -start-24 size-[32rem] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -end-16 size-[32rem] rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute top-1/3 start-1/2 size-96 rounded-full bg-emerald-300/10 blur-3xl" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:26px_26px]"
        />

        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 pb-20 pt-24 sm:pt-28">
          <div className="grid gap-6 text-center">
            <span className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
              <SparklesIcon className="size-4" />
              {ar.home.eyebrow}
            </span>
            <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
              {settings.heroTitle ?? ar.home.heroTitleFallback}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 sm:text-xl">
              {settings.heroSubtitle ?? ar.home.heroSubtitleFallback}
            </p>
          </div>

          <div className="mx-auto w-full max-w-3xl">
            <HeroSearch destinations={searchDestinations} />
          </div>

          <div className="mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-primary-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheckIcon className="size-4" />
              جداول يومية مفصّلة
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheckIcon className="size-4" />
              متابعة كاملة للرحلة
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GlobeIcon className="size-4" />
              وجهات داخلية وخارجية
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats strip (overlaps hero) ────────────────────────── */}
      <section className="relative z-10 mx-auto -mt-16 max-w-6xl px-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-lg lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3 bg-card p-5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="size-5" />
              </div>
              <div className="grid gap-0.5">
                <p
                  className="text-2xl font-extrabold leading-none"
                  dir={stat.ltr ? "ltr" : undefined}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <CenteredHeading
          title={ar.home.categoriesTitle}
          subtitle={ar.home.categoriesSubtitle}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${cat.gradient} p-6 text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              <div className="absolute -end-6 -top-6 size-28 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
              <div className="relative grid gap-3">
                <div className="flex size-12 items-center justify-center rounded-xl bg-white/20">
                  <cat.icon className="size-6" />
                </div>
                <p className="font-bold">{cat.title}</p>
                <p className="text-sm text-white/80">{cat.body}</p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white/90">
                  {ar.actions.moreDetails}
                  <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured tours ─────────────────────────────────────── */}
      {tours.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <SectionHeading
            title={ar.misc.featuredPrograms}
            subtitle={ar.home.sectionToursSubtitle}
            href="/programs"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        </section>
      )}

      {/* ── Featured destinations ──────────────────────────────── */}
      {featuredDestinations.length > 0 && (
        <section className="border-y bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <SectionHeading
              title={ar.misc.featuredDestinations}
              subtitle={ar.home.sectionDestinationsSubtitle}
              href="/destinations"
            />
            {/* Mosaic grid: first card spans 2 cols + 2 rows on large screens */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:grid-rows-2">
              {featuredDestinations.slice(0, 7).map((destination, i) => (
                <div
                  key={destination.id}
                  className={i === 0 ? "col-span-2 row-span-2 lg:col-span-2 lg:row-span-2" : ""}
                >
                  <DestinationCard destination={destination} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Schedule highlight (differentiator) ────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-center gap-8 rounded-3xl border bg-gradient-to-bl from-primary/5 to-teal-500/5 p-8 lg:grid-cols-2 lg:p-12">
          <div className="grid gap-4">
            <Badge variant="secondary" className="w-fit">
              <CalendarRangeIcon className="size-3.5" />
              جداول مدروسة
            </Badge>
            <h2 className="text-2xl font-bold sm:text-3xl">{ar.home.scheduleTitle}</h2>
            <p className="leading-relaxed text-muted-foreground">{ar.home.scheduleBody}</p>
            <Button asChild className="w-fit">
              <Link href="/programs">
                {ar.home.finalCtaBrowse}
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                ١
              </div>
              <p className="font-bold">اليوم الأول — نموذج جدول</p>
            </div>
            <div className="ms-4 grid gap-3 border-s-2 border-primary/20 ps-6">
              {scheduleSample.map((item) => (
                <div
                  key={item.title}
                  className="relative rounded-lg border bg-background p-3"
                >
                  <div className="absolute -start-[2.1rem] top-3.5 flex size-6 items-center justify-center rounded-full border bg-background text-primary">
                    <item.icon className="size-3" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-xs text-muted-foreground" dir="ltr">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Study band + journey + programs ────────────────────── */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16">
          <div className="mx-auto grid max-w-2xl gap-3 text-center">
            <Badge variant="secondary" className="mx-auto w-fit">
              <GraduationCapIcon className="size-3.5" />
              {ar.nav.study}
            </Badge>
            <h2 className="text-2xl font-bold sm:text-3xl">{ar.home.studyBandTitle}</h2>
            <p className="text-muted-foreground">{ar.home.studyBandBody}</p>
          </div>

          {/* Milestone stepper (horizontal-scroll on mobile) */}
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
            {STUDY_MILESTONE_TEMPLATES.map((title, index) => (
              <div
                key={title}
                className="w-44 shrink-0 rounded-xl border bg-card p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  {index < STUDY_MILESTONE_TEMPLATES.length - 1 && (
                    <span className="h-px flex-1 bg-border" />
                  )}
                </div>
                <p className="mt-3 text-sm font-medium leading-snug">{title}</p>
              </div>
            ))}
          </div>

          {studies.length > 0 && (
            <div className="grid gap-6">
              <SectionHeading
                title={ar.misc.studyPrograms}
                subtitle={ar.home.sectionStudySubtitle}
                href="/study"
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {studies.map((program) => (
                  <ProgramCard key={program.id} program={program} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <CenteredHeading title={ar.home.howTitle} subtitle={ar.home.howSubtitle} />
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative overflow-hidden grid gap-3 rounded-2xl border bg-card p-6 text-center"
            >
              <span className="absolute end-3 top-0 text-[7rem] font-black leading-none text-primary/5 select-none pointer-events-none">
                {index + 1}
              </span>
              <div className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <step.icon className="size-7" />
              </div>
              <p className="relative font-bold">{step.title}</p>
              <p className="relative text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why us ─────────────────────────────────────────────── */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <CenteredHeading title={ar.misc.whyUs} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="grid gap-3 rounded-2xl border bg-card p-6"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-6" />
                </div>
                <p className="font-bold">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <CenteredHeading
            title={ar.misc.testimonials}
            subtitle={ar.home.testimonialsSubtitle}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="relative">
                <CardContent className="grid gap-3">
                  <QuoteIcon className="absolute end-6 top-6 size-8 text-primary/10" />
                  <div className="flex gap-0.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon key={i} className="size-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed">{testimonial.text}</p>
                  <div className="mt-1 flex items-center gap-3 border-t pt-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                      {testimonial.name.trim().charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{testimonial.name}</p>
                      {testimonial.role && (
                        <p className="text-xs text-muted-foreground">
                          {testimonial.role}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Agent CTA ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <Card className="overflow-hidden border-0 bg-gradient-to-l from-primary to-teal-800 text-primary-foreground">
          <CardContent className="grid items-center gap-4 py-10 text-center sm:grid-cols-[1fr_auto] sm:text-start">
            <div className="grid gap-2">
              <h2 className="text-2xl font-bold">{ar.misc.becomeAgent}</h2>
              <p className="max-w-2xl text-primary-foreground/85">
                {ar.misc.becomeAgentBody}
              </p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/agents">
                {ar.actions.apply}
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-bl from-primary to-teal-900 text-primary-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 -end-20 size-80 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute -bottom-24 -start-16 size-80 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-3xl gap-5 px-4 py-20 text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">{ar.home.finalCtaTitle}</h2>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/85">
            {ar.home.finalCtaBody}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/programs">{ar.home.finalCtaBrowse}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link href="/contact">{ar.home.finalCtaContact}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
