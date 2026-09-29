import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAuthenticated, SESSION_COOKIE } from "@/lib/gate";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const allowed =
    pathname === "/login" ||
    pathname.startsWith("/api/auth/");

  const authenticated = isAuthenticated(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (allowed || authenticated) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
