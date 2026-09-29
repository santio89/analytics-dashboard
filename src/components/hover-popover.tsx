"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type HoverPopoverProps = {
  content: ReactNode;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  disabled?: boolean;
};

export function HoverPopover({
  content,
  children,
  className,
  panelClassName,
  disabled = false,
}: HoverPopoverProps) {
  const id = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (showTimerRef.current != null) window.clearTimeout(showTimerRef.current);
      if (hideTimerRef.current != null) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  function clearTimers() {
    if (showTimerRef.current != null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }

  function updatePosition() {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
    });
  }

  function show() {
    if (disabled || content == null || content === "") return;
    clearTimers();
    showTimerRef.current = window.setTimeout(() => {
      updatePosition();
      setVisible(true);
    }, 180);
  }

  function hide() {
    clearTimers();
    hideTimerRef.current = window.setTimeout(() => setVisible(false), 80);
  }

  return (
    <>
      <div
        ref={anchorRef}
        className={cn("inline-flex min-w-0 max-w-full", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={visible ? id : undefined}
      >
        {children}
      </div>
      {mounted &&
        !disabled &&
        content != null &&
        content !== "" &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{
              top: position.top,
              left: position.left,
              transform: "translateX(-50%)",
            }}
            className={cn(
              "pointer-events-none fixed z-200 max-w-sm rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground shadow-(--shadow) transition-opacity duration-150",
              visible ? "opacity-100" : "opacity-0",
              panelClassName,
            )}
          >
            <div className="break-words">{content}</div>
          </div>,
          document.body,
        )}
    </>
  );
}
