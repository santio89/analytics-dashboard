"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

type TextInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "className"
> & {
  label?: string;
  className?: string;
  inputClassName?: string;
};

export function TextInput({
  label,
  className,
  inputClassName,
  id,
  ...props
}: TextInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  if (!label) {
    return (
      <input
        id={inputId}
        className={cn("field", inputClassName, className)}
        {...props}
      />
    );
  }

  return (
    <label htmlFor={inputId} className={cn("grid min-w-0 gap-1.5", className)}>
      <span className="text-xs font-medium text-muted">{label}</span>
      <input id={inputId} className={cn("field", inputClassName)} {...props} />
    </label>
  );
}
