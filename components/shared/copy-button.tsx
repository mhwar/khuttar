"use client";

import * as React from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ar } from "@/lib/i18n/ar";

export function CopyButton({
  text,
  label = ar.actions.copy,
  variant = "outline",
  size = "sm",
}: {
  text: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) {
  const [copied, setCopied] = React.useState(false);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={async () => {
        // Relative paths resolve against the current origin at click time
        // (window is unavailable during SSR).
        const resolved = text.startsWith("/")
          ? new URL(text, window.location.origin).toString()
          : text;
        await navigator.clipboard.writeText(resolved);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      {copied ? ar.actions.copied : label}
    </Button>
  );
}
