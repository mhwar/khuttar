"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ar } from "@/lib/i18n/ar";

// Runs a bound server action (returning { ok, error? }) on click, with
// pending state and toast feedback. Use instead of <form action={...}> when
// the action returns a result object.
export function ActionButton({
  action,
  children,
  successMessage,
  variant,
  size,
  className,
  title,
}: {
  action: () => Promise<{ ok: boolean; error?: string }>;
  children: React.ReactNode;
  successMessage?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
  title?: string;
}) {
  const [pending, startTransition] = React.useTransition();

  return (
    <Button
      type="button"
      disabled={pending}
      variant={variant}
      size={size}
      className={className}
      title={title}
      aria-label={title}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            toast.success(successMessage ?? ar.misc.savedSuccessfully);
          } else {
            toast.error(result.error ?? ar.misc.error);
          }
        })
      }
    >
      {children}
    </Button>
  );
}
