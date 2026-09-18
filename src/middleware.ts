import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { EDGE_COOKIE_NAME, verifyTokenAtEdge } from "@/lib/auth-edge";
import { getDefaultRouteForRole } from "@/lib/role-routing";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/session",
  "/api/auth/debug-session",
  "/api/ping",
  "/_next",
  "/favicon",
  "/manifest",
  "/offline",
  "/tomvis",
  "/about-developer",
  "/sw.js",
  "/workbox",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Verify JWT token
  const token = req.cookies.get(EDGE_COOKIE_NAME)?.value;

  if (process.env.NODE_ENV !== "production") {
    console.log("[AUTH DEBUG]", {
      pathname,
      hasCookie: Boolean(token),
    });
  }

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifyTokenAtEdge(token);

  if (process.env.NODE_ENV !== "production") {
    console.log("[AUTH DEBUG VERIFIED]", {
      pathname,
      verified: Boolean(session),
      sub: session?.sub,
      role: session?.role,
    });
  }

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(EDGE_COOKIE_NAME);
    return response;
  }

  // Route protection: admin paths require management / non-employee roles
  const isEmployeeOnly = session.role === "EMPLOYEE" || session.type === "EMPLOYEE";
  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/security")) && isEmployeeOnly) {
    return NextResponse.redirect(new URL(getDefaultRouteForRole(session.role), req.url));
  }

  // Inject session info into request headers for server components
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-session-sub", session.sub);
  requestHeaders.set("x-session-role", session.role);
  requestHeaders.set("x-session-type", session.type);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|workbox).*)"],
};
