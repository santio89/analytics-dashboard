"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { ALL_TIME_START, parseDay, todayIso } from "@/lib/dates";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type DatePickerProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  min?: string;
  max?: string;
  align?: "start" | "end";
  /** When true, popover spans a paired 2-column row below lg (toolbar start/end). */
  paired?: boolean;
};

function isoDay(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function monthGrid(view: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(startOfMonth(view), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(view), { weekStartsOn: 0 }),
  });
}

export function DatePicker({
  label,
  value,
  onChange,
  min = ALL_TIME_START,
  max = todayIso(),
  align = "start",
  paired = false,
}: DatePickerProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parseDay(value || todayIso()));
  const [lastValue, setLastValue] = useState(value);

  if (lastValue !== value) {
    setLastValue(value);
    setView(parseDay(value || todayIso()));
  }

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const days = monthGrid(view);
  const prevMonth = subMonths(view, 1);
  const nextMonth = addMonths(view, 1);
  const canPrev = isoDay(endOfMonth(prevMonth)) >= min;
  const canNext = isoDay(startOfMonth(nextMonth)) <= max;

  return (
    <div ref={rootRef} className="relative grid w-full min-w-0 gap-1.5 lg:w-46 lg:shrink-0">
      <span id={id} className="text-xs font-medium text-muted">
        {label}
      </span>
      <button
        type="button"
        aria-labelledby={id}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="field flex w-full items-center gap-2 text-left"
        onClick={() => {
          setView(parseDay(value || todayIso()));
          setOpen((current) => !current);
        }}
      >
        <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
        <span className="min-w-0 truncate">
          {value ? format(parseDay(value), "MMM d, yyyy") : "Pick a date"}
        </span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className={cn(
            "absolute top-[calc(100%+0.4rem)] z-30 max-w-70 rounded-xl border border-border bg-card p-3 shadow-(--shadow) lg:w-70 lg:max-w-none",
            paired
              ? "w-[min(calc(200%+0.75rem),calc(100vw-2rem))]"
              : "w-[min(calc(100vw-2rem),100%)]",
            align === "end" ? "right-0 left-auto" : "left-0",
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-card-hover hover:text-foreground disabled:opacity-40"
              disabled={!canPrev}
              aria-label="Previous month"
              onClick={() => setView(prevMonth)}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium">{format(view, "MMMM yyyy")}</p>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-card-hover hover:text-foreground disabled:opacity-40"
              disabled={!canNext}
              aria-label="Next month"
              onClick={() => setView(nextMonth)}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[11px] font-medium text-muted"
              >
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dayValue = isoDay(day);
              const disabled = dayValue < min || dayValue > max;
              const selected = dayValue === value;
              const today = dayValue === todayIso();
              const outside = !isSameMonth(day, view);
              return (
                <button
                  key={dayValue}
                  type="button"
                  disabled={disabled}
                  aria-label={format(day, "MMM d, yyyy")}
                  aria-current={today ? "date" : undefined}
                  aria-pressed={selected}
                  className={cn(
                    "mx-auto flex h-7 w-7 items-center justify-center rounded-md text-xs tabular sm:h-8 sm:w-8",
                    outside && !selected && "text-muted/70",
                    today && !selected && "border border-border",
                    selected && "bg-accent text-accent-fg",
                    !selected && !disabled && "hover:bg-card-hover",
                    disabled && "opacity-30",
                  )}
                  onClick={() => {
                    onChange(dayValue);
                    setOpen(false);
                  }}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
