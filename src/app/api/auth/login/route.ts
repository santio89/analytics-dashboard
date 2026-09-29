import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  SESSION_VALUE,
  sessionCookieOptions,
} from "@/lib/gate";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, SESSION_VALUE, sessionCookieOptions());
  return response;
}
