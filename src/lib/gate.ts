import { timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "fa_session";
export const SESSION_VALUE = "demo";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function isAuthenticated(value: string | undefined): boolean {
  if (!value) return false;
  const left = Buffer.from(value);
  const right = Buffer.from(SESSION_VALUE);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
