import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { EDGE_COOKIE_NAME, verifyTokenAtEdge } from "@/lib/auth-edge";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
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
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifyTokenAtEdge(token);
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(EDGE_COOKIE_NAME);
    return response;
  }

  // Route protection: admin paths require non-EMPLOYEE role
  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
      !["SUPERADMIN", "ADMIN", "HR", "FINANCE", "EXECUTIVE", "OPERATIONS"].includes(session.role)) {
    return NextResponse.redirect(new URL("/check-in", req.url));
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
