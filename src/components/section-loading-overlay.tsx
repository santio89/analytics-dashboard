"use client";

import { Spinner } from "@/components/spinner";

type SectionLoadingOverlayProps = {
  label: string;
};

export function SectionLoadingOverlay({ label }: SectionLoadingOverlayProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-card/55 backdrop-blur-[1.5px]"
      aria-hidden
    >
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-(--shadow)">
        <Spinner className="h-3.5 w-3.5 text-accent" label={label} />
        <span>{label}</span>
      </div>
    </div>
  );
}
