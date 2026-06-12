"use client";

import { Label } from "@/components/ui/label";
import { useFieldError } from "@/components/shared/form-context";
import { cn } from "@/lib/utils";

// Form field wrapper: label + control + error line. Inside a FormDialog the
// error is looked up from context by `name` (falls back to htmlFor).
export function Field({
  label,
  htmlFor,
  name,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  name?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const contextError = useFieldError(name ?? htmlFor);
  const message = error ?? contextError;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !message && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {message && <p className="text-xs text-destructive">{message}</p>}
    </div>
  );
}
