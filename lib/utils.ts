import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateBookingCode() {
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `KH-${suffix}`;
}

export function generateReferralCode(name: string) {
  const base = name
    .normalize("NFKD")
    .replace(/[^A-Za-z]/g, "")
    .toUpperCase()
    .slice(0, 6);
  const digits = Math.floor(10 + Math.random() * 90);
  return `${base || "AGENT"}${digits}`;
}

// Latin slug from a (possibly Arabic) title; Arabic titles get a random
// suffix-based slug so URLs stay shareable in any context.
export function slugify(input: string) {
  const latin = input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
  if (latin.length >= 3) return latin;
  return `p-${Math.random().toString(36).slice(2, 8)}`;
}

export function splitLines(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
