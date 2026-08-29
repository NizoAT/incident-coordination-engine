import { NextRequest, NextResponse } from "next/server";

import { getSessionFromRequest } from "@/lib/auth/session";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
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
  matcher: ["/incidents/:path*", "/changes/:path*"],
};
