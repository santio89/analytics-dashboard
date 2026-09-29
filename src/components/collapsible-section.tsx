"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { SectionLoadingOverlay } from "@/components/section-loading-overlay";
import { Spinner } from "@/components/spinner";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "analytics-dashboard-collapsed";

function readCollapsed(id: string): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return map[id] ?? null;
  } catch {
    return null;
  }
}

function writeCollapsed(id: string, collapsed: boolean) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    map[id] = collapsed;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

type CollapsibleSectionProps = {
  id: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
  busy?: boolean;
  busyLabel?: string;
  children: ReactNode;
};

export function CollapsibleSection({
  id,
  title,
  description,
  actions,
  defaultOpen = true,
  className,
  contentClassName,
  busy = false,
  busyLabel = "Loading",
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(() => readCollapsed(id) ?? defaultOpen);
  const [lastId, setLastId] = useState(id);

  if (lastId !== id) {
    setLastId(id);
    setOpen(readCollapsed(id) ?? defaultOpen);
  }

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      writeCollapsed(id, !next);
      return next;
    });
  }

  const showHeaderSpinner = busy && !open;
  const showContentOverlay = busy && open;
  const visibleDescription = open ? description : undefined;
  const alignCenter = !visibleDescription;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-(--shadow)",
        className,
      )}
    >
      <div
        className={cn(
          "flex gap-2 px-3 py-3 sm:px-4",
          alignCenter ? "items-center" : "items-start",
          open && "border-b border-border",
        )}
      >
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "flex min-w-0 flex-1 gap-2 rounded-md text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent/40",
            alignCenter ? "items-center" : "items-start",
          )}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted transition-transform duration-200",
              !alignCenter && "mt-0.5",
              !open && "-rotate-90",
            )}
            aria-hidden
          />
          <div className="min-w-0">
            <h2 className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <span className="truncate">{title}</span>
              {showHeaderSpinner ? (
                <Spinner
                  className="h-3.5 w-3.5 shrink-0 text-accent"
                  label={busyLabel}
                />
              ) : null}
            </h2>
            {visibleDescription ? (
              <p className="mt-1 text-xs text-muted">{visibleDescription}</p>
            ) : null}
          </div>
        </button>
        {open && actions ? (
          <div
            className="flex shrink-0 flex-wrap items-center gap-2"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {actions}
          </div>
        ) : null}
      </div>
      {open ? (
        <div
          id={`${id}-panel`}
          className={cn("relative", showContentOverlay && "min-h-28")}
          aria-busy={showContentOverlay}
        >
          <div
            className={cn(
              contentClassName,
              showContentOverlay && "opacity-[0.72] transition-opacity duration-200",
            )}
          >
            {children}
          </div>
          {showContentOverlay ? <SectionLoadingOverlay label={busyLabel} /> : null}
        </div>
      ) : null}
    </section>
  );
}
