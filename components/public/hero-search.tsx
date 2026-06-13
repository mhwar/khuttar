"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { LABELS, STUDY_KINDS, TOUR_TYPES } from "@/lib/constants";
import { NativeSelect } from "@/components/shared/native-select";
import { Button } from "@/components/ui/button";
import { ar } from "@/lib/i18n/ar";
import { cn } from "@/lib/utils";

type Mode = "tour" | "study";

// Premium hero search: a segmented tour/study switch over a destination + type
// filter that routes into the existing /programs and /study listing pages.
// Native <form> with name attributes keeps a no-JS tour search working; JS adds
// the mode switch and routes study searches to /study.
export function HeroSearch({
  destinations,
}: {
  destinations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>("tour");
  const [type, setType] = React.useState("");
  const [destination, setDestination] = React.useState("");

  function switchMode(next: Mode) {
    setMode(next);
    setType("");
    setDestination("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (mode === "tour") {
      if (type) params.set("type", type);
      if (destination) params.set("destination", destination);
      router.push(`/programs${params.size ? `?${params}` : ""}`);
    } else {
      if (type) params.set("kind", type);
      router.push(`/study${params.size ? `?${params}` : ""}`);
    }
  }

  const tabs: { value: Mode; label: string }[] = [
    { value: "tour", label: ar.home.searchTour },
    { value: "study", label: ar.home.searchStudy },
  ];

  return (
    <div className="rounded-2xl border bg-card p-2 text-card-foreground shadow-2xl shadow-primary/15 ring-1 ring-black/5">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => switchMode(tab.value)}
            aria-pressed={mode === tab.value}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              mode === tab.value
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        action="/programs"
        method="get"
        className="mt-2 flex flex-col gap-2 p-2 sm:flex-row sm:items-center"
      >
        <NativeSelect
          name="type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          aria-label={mode === "tour" ? ar.home.searchTypeTour : ar.home.searchTypeStudy}
          className="h-11 sm:flex-1"
        >
          <option value="">
            {mode === "tour" ? ar.home.searchTypeTour : ar.home.searchTypeStudy}
          </option>
          {mode === "tour"
            ? TOUR_TYPES.map((value) => (
                <option key={value} value={value}>
                  {LABELS.tourType[value]}
                </option>
              ))
            : STUDY_KINDS.map((value) => (
                <option key={value} value={value}>
                  {LABELS.studyKind[value]}
                </option>
              ))}
        </NativeSelect>

        {mode === "tour" && (
          <NativeSelect
            name="destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            aria-label={ar.home.searchDestination}
            className="h-11 sm:flex-1"
          >
            <option value="">{ar.home.searchDestination}</option>
            {destinations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </NativeSelect>
        )}

        <Button type="submit" size="lg" className="h-11 sm:w-auto">
          <SearchIcon className="size-4" />
          {ar.home.searchCta}
        </Button>
      </form>
    </div>
  );
}
