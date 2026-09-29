"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Spinner } from "@/components/spinner";
import { APP_NAME, APP_TAGLINE } from "@/lib/app-config";

export function LoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", { method: "POST" });
      if (!response.ok) {
        throw new Error("Could not sign in");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <p className="text-center text-sm text-muted">
        Preview the dashboard with realistic sample data. No credentials required.
      </p>
      {error ? <p className="text-sm text-down">{error}</p> : null}
      <button
        type="submit"
        className="btn btn-primary h-11 w-full text-sm"
        disabled={submitting}
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            Signing in…
          </span>
        ) : (
          "Log in"
        )}
      </button>
    </form>
  );
}

export function LoginBrand() {
  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft">
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
          <path fill="#1a04ff" d="M4 6h24l-8 10v10l-4 2V16L4 6z" />
        </svg>
      </div>
      <p className="mt-4 text-base font-semibold tracking-tight">{APP_NAME}</p>
      <p className="mt-0.5 text-xs text-muted">{APP_TAGLINE}</p>
    </div>
  );
}
