import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) must be configured with at least 32 characters");
  }
  return secret;
}
export const COOKIE_NAME = "sj_token";

export interface SessionPayload {
  sub: string;
  email?: string;
  role: string;
  type: string;
  name?: string;
  siteId?: string;
  employeeCode?: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<SessionPayload, "iat" | "exp">): string {
  return jwt.sign(payload as object, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(
  response: NextResponse,
  payload: Omit<SessionPayload, "iat" | "exp">
): NextResponse {
  const token = signToken(payload);
  const isProduction = process.env.NODE_ENV === "production";
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.delete(COOKIE_NAME);
  return response;
}

export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireSession(
  req: NextRequest
): { session: SessionPayload } | { error: NextResponse } {
  const session = getSessionFromRequest(req);
  if (!session) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: "AUTH_REQUIRED", message: "กรุณาเข้าสู่ระบบ" } },
        { status: 401 }
      ),
    };
  }
  return { session };
}

export function requireRole(
  req: NextRequest,
  roles: string[]
): { session: SessionPayload } | { error: NextResponse } {
  const result = requireSession(req);
  if ("error" in result) return result;
  if (!roles.includes(result.session.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" } },
        { status: 403 }
      ),
    };
  }
  return result;
}
