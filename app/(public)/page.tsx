import Link from "next/link";
import {
  CalendarRangeIcon,
  GraduationCapIcon,
  HandshakeIcon,
  HeadsetIcon,
  MapIcon,
  QuoteIcon,
} from "lucide-react";
import { db } from "@/lib/db";
import { getSettings, publicProgramWhere } from "@/lib/queries";
import { ar } from "@/lib/i18n/ar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DestinationCard, ProgramCard } from "@/components/public/cards";

export default async function HomePage() {
  const [settings, destinations, tours, studies, testimonials] =
    await Promise.all([
      getSettings(),
      db.destination.findMany({
        where: { active: true, featured: true },
        orderBy: { sortOrder: "asc" },
        take: 4,
      }),
      db.program.findMany({
        where: { ...publicProgramWhere, category: "TOUR" },
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        take: 6,
        include: { destination: { select: { name: true } } },
      }),
      db.program.findMany({
        where: { ...publicProgramWhere, category: "STUDY" },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { destination: { select: { name: true } } },
      }),
      db.testimonial.findMany({
        where: { active: true },
        orderBy: { sortOrder: "asc" },
        take: 3,
      }),
    ]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-bl from-primary via-primary/90 to-teal-800 text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 text-center">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            {settings.heroTitle ?? ar.tagline}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/85">
            {settings.heroSubtitle ??
              "برامج سياحية داخلية وخارجية بجداول مصممة بعناية، وبرامج دراسة لغة وابتعاث مع تسهيل كامل لإجراءات القبول."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/programs">{ar.nav.programs}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <Link href="/study">{ar.nav.study}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14">
        <h2 className="text-center text-2xl font-bold">{ar.misc.whyUs}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: CalendarRangeIcon,
              title: "جداول مصممة بعناية",
              body: "برامج يومية مفصلة: أنشطة، تنقلات، فنادق ووجبات — تعرف رحلتك قبل أن تبدأ.",
            },
            {
              icon: GraduationCapIcon,
              title: "خبرة في القبول والابتعاث",
              body: "نسهّل إجراءات القبول والسكن والتأشيرة لبرامج اللغة والدراسة بالخارج.",
            },
            {
              icon: HandshakeIcon,
              title: "شبكة وكلاء وشركاء",
              body: "وكلاء معتمدون ومزوّدو نقل وفنادق نتعامل معهم مباشرة لخدمتك أينما كنت.",
            },
            {
              icon: HeadsetIcon,
              title: "متابعة طوال الرحلة",
              body: "رابط متابعة خاص لرحلتك وتنسيق مواصلاتك مع سائقينا أولاً بأول.",
            },
          ].map((feature) => (
            <Card key={feature.title}>
              <CardContent className="grid gap-2 text-center">
                <feature.icon className="mx-auto size-8 text-primary" />
                <p className="font-bold">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured destinations */}
      {destinations.length > 0 && (
        <section className="bg-muted/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{ar.misc.featuredDestinations}</h2>
              <Button variant="link" asChild>
                <Link href="/destinations">عرض الكل ←</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {destinations.map((destination) => (
                <DestinationCard key={destination.id} destination={destination} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured tours */}
      {tours.length > 0 && (
        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{ar.misc.featuredPrograms}</h2>
            <Button variant="link" asChild>
              <Link href="/programs">عرض الكل ←</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tours.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        </section>
      )}

      {/* Study programs */}
      {studies.length > 0 && (
        <section className="bg-muted/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{ar.misc.studyPrograms}</h2>
              <Button variant="link" asChild>
                <Link href="/study">عرض الكل ←</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {studies.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Agent CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Card className="bg-gradient-to-l from-primary to-teal-800 text-primary-foreground">
          <CardContent className="grid items-center gap-4 py-10 text-center sm:grid-cols-[1fr_auto] sm:text-start">
            <div className="grid gap-2">
              <h2 className="text-2xl font-bold">{ar.misc.becomeAgent}</h2>
              <p className="text-primary-foreground/85">{ar.misc.becomeAgentBody}</p>
            </div>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/agents">{ar.actions.apply}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16">
          <h2 className="text-center text-2xl font-bold">{ar.misc.testimonials}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id}>
                <CardContent className="grid gap-3">
                  <QuoteIcon className="size-5 text-primary" />
                  <p className="text-sm leading-relaxed">{testimonial.text}</p>
                  <div>
                    <p className="text-sm font-bold">{testimonial.name}</p>
                    {testimonial.role && (
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Quick links strip */}
      <section className="border-t bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 py-8 text-sm text-muted-foreground">
          <MapIcon className="size-4 text-primary" />
          <span>
            استكشف <Link href="/destinations" className="text-primary hover:underline">وجهاتنا</Link>،
            تصفح <Link href="/programs" className="text-primary hover:underline">برامجنا</Link>،
            أو <Link href="/contact" className="text-primary hover:underline">تواصل معنا</Link> لنصمم لك برنامجاً خاصاً.
          </span>
        </div>
      </section>
    </>
  );
}
