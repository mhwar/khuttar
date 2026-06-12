"use client";

import { Direction } from "radix-ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return <Direction.Provider dir="rtl">{children}</Direction.Provider>;
}
