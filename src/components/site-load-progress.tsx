"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";

const FADE_MS = 200;
const MAX_VISIBLE_MS = 500;

function subscribeNoop() {
  return () => {};
}

export function SiteLoadProgress() {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    let hideTimer: number | undefined;

    const hide = () => {
      setFading(true);
      hideTimer = window.setTimeout(() => setVisible(false), FADE_MS);
    };

    if (document.readyState === "complete") {
      hide();
    } else {
      window.addEventListener("load", hide, { once: true });
    }

    const maxTimer = window.setTimeout(hide, MAX_VISIBLE_MS);

    return () => {
      window.removeEventListener("load", hide);
      window.clearTimeout(maxTimer);
      if (hideTimer != null) window.clearTimeout(hideTimer);
    };
  }, [mounted]);

  if (!mounted || !visible) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-transparent transition-opacity duration-200",
        fading ? "opacity-0" : "opacity-100",
      )}
    >
      <div className="site-load-progress__bar h-full w-1/3 bg-accent" />
    </div>
  );
}
