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

  // Password expiration enforcement
  const passwordStatus = session.passwordStatus;
  const isPasswordChangePath = pathname.startsWith("/account/change-password") || pathname.startsWith("/api/account/change-password");
  if (["EXPIRED", "MUST_CHANGE"].includes(String(passwordStatus)) && !isPasswordChangePath) {
    return NextResponse.redirect(new URL("/account/change-password", req.url));
  }

  const managementRoles = ["SUPERADMIN", "ADMIN", "HR", "FINANCE", "EXECUTIVE", "OPERATIONS", "SUPERVISOR"];
  const employeeOnlyPaths = ["/check-in", "/history", "/leave", "/payslip", "/expenses", "/sos", "/chat"];
  if (managementRoles.includes(session.role) && employeeOnlyPaths.some((path) => pathname === path || pathname.startsWith(path + "/"))) {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  if ((pathname === "/operations" || pathname.startsWith("/operations/")) && !managementRoles.includes(session.role)) {
    return NextResponse.redirect(new URL("/check-in", req.url));
  }

  // Route protection: admin paths require non-EMPLOYEE role
  if ((pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) &&
      !managementRoles.includes(session.role)) {
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
