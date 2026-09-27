import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

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
  sessionId?: string;
  email?: string;
  role: string;
  type: string;
  authStrength?: string;
  primaryRole?: string;
  authzVersion?: number;
  name?: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<SessionPayload, "iat" | "exp">): string {
  return jwt.sign(payload as object, getJwtSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as SessionPayload;
    if (!payload.sub || !payload.role || !payload.type || !payload.exp) return null;
    return payload;
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

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifyToken(token);
  if (!session?.sessionId) return null;
  try {
    const stored = await prisma.userSession.findUnique({ where: { sessionId: session.sessionId }, include: { user: true } });
    if (!stored || stored.userId !== session.sub || stored.status !== "ACTIVE" || stored.expiresAt <= new Date()) return null;
    const user = stored.user;
    if (!user.isActive || user.isLocked || user.deletedAt || user.mustChangePassword ||
        user.passwordExpiresAt && user.passwordExpiresAt <= new Date() ||
        user.authzVersion !== session.authzVersion || stored.authzVersion !== user.authzVersion ||
        user.role !== session.role || user.mfaEnabled && stored.authStrength !== "MFA") return null;
    return session;
  } catch { return null; }
}

export async function requireSession(
  req: NextRequest
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const session = await getSessionFromRequest(req);
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

export async function requireRole(
  req: NextRequest,
  roles: string[]
): Promise<{ session: SessionPayload } | { error: NextResponse }> {
  const result = await requireSession(req);
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
