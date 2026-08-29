import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";
import { observeHttpRequest } from "@/lib/observability/http";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/api/")) {
    observeHttpRequest(request);
    return NextResponse.next();
  }

  const response = NextResponse.next();
  observeHttpRequest(request);
  const session = await getSessionFromRequest(request, response);

  if (!session.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/incidents/:path*", "/changes/:path*", "/api/:path*"],
};
