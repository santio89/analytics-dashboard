"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function subscribeTheme(onChange: () => void) {
  window.addEventListener("themechange", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("themechange", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => "light");

  function toggle() {
    const root = document.documentElement;
    root.classList.add("theme-instant");

    const next = currentTheme() === "dark" ? "light" : "dark";
    root.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
    window.dispatchEvent(new Event("themechange"));

    void root.offsetHeight;
    requestAnimationFrame(() => {
      root.classList.remove("theme-instant");
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-outline header-action-btn btn-icon shrink-0"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
    </button>
  );
}