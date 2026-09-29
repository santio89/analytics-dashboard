"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { LogOut } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";

type SiteHeaderProps = {
  entryLookup: ReactNode;
  themeToggle: ReactNode;
};

export function SiteHeader({ entryLookup, themeToggle }: SiteHeaderProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const compactOn = 48;
    const compactOff = 20;

    const onScroll = () => {
      const y = window.scrollY;
      setScrolled((current) => (current ? y > compactOff : y > compactOn));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function logOut() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <header className="site-header" data-compact={scrolled || undefined}>
        <div className="site-header__backdrop" aria-hidden />
        <div className="site-header__inner">
          <div className="site-header__brand" aria-hidden={scrolled}>
            <div className="site-header__logo site-header__logo--mark" aria-hidden>
              <svg viewBox="0 0 32 32" className="h-8 w-8" role="img">
                <defs>
                  <linearGradient id="funnel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1a04ff" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#funnel-gradient)"
                  d="M4 6h24l-8 10v10l-4 2V16L4 6z"
                />
              </svg>
            </div>
            <div className="site-header__title">
              <p className="site-header__name">{APP_NAME}</p>
              <p className="site-header__tagline">{APP_TAGLINE}</p>
            </div>
          </div>
          <div className="site-header__lead" aria-hidden />
          <div className="site-header__actions">
            <div className="site-header__pill">
              {entryLookup}
              <button
                type="button"
                className="btn btn-outline header-action-btn shrink-0"
                onClick={() => void logOut()}
                disabled={loggingOut}
                aria-busy={loggingOut}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="header-expandable hidden sm:inline">
                  {loggingOut ? "Signing out…" : "Log out"}
                </span>
              </button>
              {themeToggle}
            </div>
          </div>
          <div className="site-header__trail" aria-hidden />
        </div>
      </header>
  );
}
