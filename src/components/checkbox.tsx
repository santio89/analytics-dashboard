"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: CheckboxProps) {
  return (
    <label
      className={cn(
        "checkbox inline-flex cursor-pointer select-none items-center gap-2 text-xs leading-none",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <input
        type="checkbox"
        className="checkbox__input sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="checkbox__box" aria-hidden>
        <Check className="checkbox__icon h-3 w-3" />
      </span>
      {label}
    </label>
  );
}
