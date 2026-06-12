import { cn } from "@/lib/utils";

// Styled native <select>: RTL-correct, zero-JS, submits with plain forms.
export function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "dark:bg-input/30",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function enumOptions(
  values: readonly string[],
  labels: Record<string, string>,
) {
  return values.map((value) => (
    <option key={value} value={value}>
      {labels[value] ?? value}
    </option>
  ));
}
