"use client";

import { cn } from "@/lib/cn";

type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = "Loading" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent",
        className,
      )}
    />
  );
}
