import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecretBytes, SESSION_COOKIE } from "@/lib/server-env";

export async function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return redirectToLogin(req);
  }

  try {
    await jwtVerify(token, getJwtSecretBytes());
    return NextResponse.next();
  } catch {
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", `${req.nextUrl.pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/app/:path*"],
};
