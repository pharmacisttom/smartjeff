import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, getSessionFromRequest, verifyToken } from "@/lib/auth-jwt";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? verifyToken(token) : null;
  const { verifyTokenAtEdge } = await import("@/lib/auth-edge");
  const edgeSession = token ? await verifyTokenAtEdge(token) : null;

  return NextResponse.json({
    cookiePresent: Boolean(token),
    nodeTokenValid: Boolean(session),
    edgeTokenValid: Boolean(edgeSession),
    secretConfigured: Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET),
    secretLength: (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET)?.length || 0,
    userIdPresent: Boolean(session?.sub),
    role: session?.role || null,
    environment: process.env.NODE_ENV || "development",
  });
}
