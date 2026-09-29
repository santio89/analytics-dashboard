"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { TruncatedText } from "@/components/truncated-text";
import { cn } from "@/lib/cn";

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  options: SelectOption[];
  placeholder?: string;
  align?: "start" | "end";
  className?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "Select…",
  align = "start",
  className,
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search…",
}: SelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((option) => option.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!searchable || !normalizedQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery, options, searchable]);

  function closeMenu() {
    setQuery("");
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    if (!searchable) return;
    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn("relative grid w-full min-w-0 gap-1.5", className)}
    >
      {label && (
        <span id={id} className="text-xs font-medium text-muted">
          {label}
        </span>
      )}
      <button
        type="button"
        aria-labelledby={label ? id : undefined}
        aria-label={label ? undefined : placeholder}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className={cn(
          "field flex w-full items-center gap-2 text-left",
          open && "border-accent shadow-[0_0_0_1px_var(--accent)]",
        )}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
      >
        <TruncatedText
          text={selected?.label ?? placeholder}
          className="flex-1"
        />
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div
          aria-label={label ?? placeholder}
          className={cn(
            "absolute top-[calc(100%+0.4rem)] z-30 flex max-h-60 w-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow)",
            align === "end" ? "right-0 left-auto" : "left-0",
          )}
        >
          {searchable && (
            <div className="border-b border-border p-1.5">
              <input
                ref={searchRef}
                type="search"
                value={query}
                placeholder={searchPlaceholder}
                aria-label={`Filter ${label ?? placeholder}`}
                className="field h-8 text-sm"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.stopPropagation();
                    closeMenu();
                  }
                }}
              />
            </div>
          )}
          <div role="listbox" className="overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="px-2.5 py-2 text-sm text-muted">No matches</p>
            ) : (
              filteredOptions.map((option) => {
                const selectedOption = option.value === value;
                return (
                  <button
                    key={option.value || "__empty__"}
                    type="button"
                    role="option"
                    aria-selected={selectedOption}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm",
                      selectedOption
                        ? "bg-accent text-accent-fg"
                        : "text-foreground hover:bg-card-hover",
                    )}
                    onClick={() => {
                      onChange(option.value);
                      closeMenu();
                    }}
                  >
                    <TruncatedText text={option.label} className="flex-1" />
                    {selectedOption && (
                      <Check className="h-3.5 w-3.5 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
