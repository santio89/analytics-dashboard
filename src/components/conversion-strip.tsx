"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  computeDelta,
  deltaTone,
  formatCompact,
  formatDelta,
  formatRate,
} from "@/lib/cn";
import { CollapsibleSection } from "@/components/collapsible-section";
import { SectionUnavailable } from "@/components/section-unavailable";
import type { StageTotal } from "@/lib/overview";
import { KEY_METRICS, updatingSectionLabel } from "@/lib/section-labels";

type ConversionStripProps = {
  visitors: number;
  stages: StageTotal[];
  previousVisitors?: number;
  previousStages?: StageTotal[];
  compareOn?: boolean;
  unavailableMessage?: string;
  busy?: boolean;
  actions?: ReactNode;
};

function previousCount(
  title: string,
  previousVisitors: number,
  previousStages: StageTotal[],
) {
  if (title === "Unique users") return previousVisitors;
  return previousStages.find((stage) => stage.title === title)?.count ?? 0;
}

export function ConversionStrip({
  visitors,
  stages,
  previousVisitors = 0,
  previousStages = [],
  compareOn = false,
  unavailableMessage,
  busy = false,
  actions,
}: ConversionStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [edges, setEdges] = useState({ left: false, right: false });
  const [dragging, setDragging] = useState(false);

  const items = [{ title: "Unique users", count: visitors }, ...stages];
  const maxCount = Math.max(...items.map((item) => item.count), 1);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setEdges({
      left: el.scrollLeft > 4,
      right: maxScroll > 4 && el.scrollLeft < maxScroll - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length, updateEdges]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el || event.button !== 0) return;

    dragRef.current = {
      active: true,
      startX: event.clientX,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    el.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el || !dragRef.current.active) return;

    const delta = event.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 3) dragRef.current.moved = true;
    el.scrollLeft = dragRef.current.scrollLeft - delta;
    updateEdges();
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (!el || !dragRef.current.active) return;

    dragRef.current.active = false;
    setDragging(false);
    if (el.hasPointerCapture(event.pointerId)) {
      el.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <CollapsibleSection
      id="conversion-strip"
      title={KEY_METRICS}
      contentClassName="relative"
      busy={busy}
      busyLabel={updatingSectionLabel(KEY_METRICS)}
      actions={actions}
    >
      {unavailableMessage ? (
        <SectionUnavailable message={unavailableMessage} />
      ) : (
        <>
      {edges.left && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 rounded-l-2xl bg-linear-to-r from-card to-transparent"
        />
      )}
      {edges.right && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 rounded-r-2xl bg-linear-to-l from-card to-transparent"
        />
      )}

      <div
        ref={scrollRef}
        className={`scrollbar-none overflow-x-auto overscroll-x-contain touch-pan-x select-none ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onScroll={updateEdges}
      >
        <div className="flex min-w-max">
          {items.map((item, index) => {
            const rate =
              item.title === "Unique users"
                ? 100
                : visitors > 0
                  ? (item.count / visitors) * 100
                  : 0;
            const prior = previousCount(
              item.title,
              previousVisitors,
              previousStages,
            );
            const delta = computeDelta(item.count, prior);

            return (
              <div
                key={item.title}
                className={`relative min-w-[158px] px-4 py-4 ${
                  index === 0 ? "" : "border-l border-border"
                }`}
              >
                <p className="pr-2 text-xs text-muted">{item.title}</p>
                <p className="mt-1 tabular text-xl font-semibold tracking-tight">
                  {formatCompact(item.count)}
                </p>
                <p className="tabular text-xs text-muted">{formatRate(rate)}</p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-foreground/35"
                    style={{
                      width: `${Math.max((item.count / maxCount) * 100, 2)}%`,
                    }}
                  />
                </div>
                {compareOn && (
                  <>
                    <p className="mt-2 tabular text-xs text-muted">
                      {formatCompact(prior)} prior
                    </p>
                    <p
                      className={`mt-0.5 tabular text-xs font-medium ${deltaTone(delta)}`}
                    >
                      {formatDelta(delta)} vs prior
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}
    </CollapsibleSection>
  );
}
