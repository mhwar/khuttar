"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ar } from "@/lib/i18n/ar";

type Section = { id: string; label: string };

export function ProgramNav({ sections }: { sections: Section[] }) {
  const [active, setActive] = React.useState<string>(sections[0]?.id ?? "");

  React.useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, [sections]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (sections.length < 2) return null;

  return (
    <nav className="sticky top-16 z-30 -mx-4 border-b bg-background/95 backdrop-blur sm:mx-0 sm:rounded-none">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        {sections.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className={cn(
              "shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              active === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function buildProgramSections({
  hasDays,
  hasInclusions,
}: {
  hasDays: boolean;
  hasInclusions: boolean;
}): Section[] {
  const sections: Section[] = [{ id: "overview", label: ar.detail.overview }];
  if (hasDays) sections.push({ id: "itinerary", label: ar.detail.itinerarySection });
  if (hasInclusions) sections.push({ id: "inclusions", label: ar.detail.includesSection });
  sections.push({ id: "booking", label: ar.detail.bookSection });
  return sections;
}
