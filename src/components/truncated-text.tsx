"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { HoverPopover } from "@/components/hover-popover";
import { cn } from "@/lib/cn";

type TruncatedTextProps = {
  text: string;
  className?: string;
  as?: "span" | "div" | "p";
};

export function TruncatedText({
  text,
  className,
  as: Tag = "span",
}: TruncatedTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    function measure() {
      const node = ref.current;
      if (!node) return;
      setOverflows(node.scrollWidth > node.clientWidth + 1);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  const label = (
    <Tag ref={ref as never} className={cn("block min-w-0 truncate", className)}>
      {text}
    </Tag>
  );

  return (
    <HoverPopover content={text} disabled={!overflows} className={cn("min-w-0 max-w-full", className)}>
      {label}
    </HoverPopover>
  );
}
