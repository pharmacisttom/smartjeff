import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { AuditService } from "@/server/services/audit.service";
import { hashPassword } from "@/lib/password";
import { ACTIVATION_PIN_TTL_HOURS, generateActivationPin, hashActivationPin } from "@/lib/activation-pin";
import { DEMO_LANGUAGES, DEMO_ROLE_OPTIONS, isDemoEnvironment, readiness, validateDemoPassword } from "@/lib/demo-accounts";

const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("assign"), demoRole: z.enum(["ADMIN", "EXECUTIVE", "HR_PAYROLL", "COORDINATOR", "SITE_SUPERVISOR", "EMPLOYEE"]), userId: z.string().min(1) }),
  z.object({ action: z.enum(["unlock", "enable", "disable", "resetMfa", "resetPin", "logout"]), userId: z.string().min(1) }),
  z.object({ action: z.literal("password"), userId: z.string().min(1), password: z.string() }),
  z.object({ action: z.literal("passwordAll"), password: z.string() }),
  z.object({ action: z.literal("language"), userId: z.string().min(1), language: z.enum(DEMO_LANGUAGES) }),
  z.object({ action: z.literal("activationPin"), userId: z.string().min(1) }),
  z.object({ action: z.literal("prepare") }),
]);

async function actor(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return null;
  const auth = await AuthorizationService.authorize({ userId: session.sub, permission: "security.demo.manage" });
  return auth.allowed ? session : null;
}

const userSelect = { id: true, email: true, displayName: true, isActive: true, isLocked: true, mfaEnabled: true, passwordHash: true, activationPinHash: true, activationPinExpiresAt: true, lastLoginAt: true, employee: { select: { preferredLanguage: true, site: { select: { name: true } } } }, roleAssignments: { where: { status: "ACTIVE" }, select: { role: { select: { code: true } } } } } as const;

export async function GET(req: NextRequest) {
  const session = await actor(req);
  if (!session) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const [accounts, users] = await Promise.all([
    prisma.demoAccount.findMany({ include: { user: { select: userSelect } }, orderBy: { sortOrder: "asc" } }),
    prisma.user.findMany({ select: userSelect, orderBy: { email: "asc" } }),
  ]);
  const serialize = (a: typeof accounts[number]) => {
    const codes = a.user.roleAssignments.map((x) => x.role.code);
    const roleValid = (DEMO_ROLE_OPTIONS[a.demoRole as keyof typeof DEMO_ROLE_OPTIONS] as readonly string[] | undefined)?.some((r) => codes.includes(r)) ?? false;
    return { id: a.id, demoRole: a.demoRole, isEnabled: a.isEnabled, label: a.label, user: { id: a.user.id, email: a.user.email, displayName: a.user.displayName, isActive: a.user.isActive, isLocked: a.user.isLocked, mfaEnabled: a.user.mfaEnabled, activationPinActive: Boolean(a.user.activationPinHash && a.user.activationPinExpiresAt && a.user.activationPinExpiresAt > new Date()), passwordReady: Boolean(a.user.passwordHash), lastLoginAt: a.user.lastLoginAt, site: a.user.employee?.site?.name ?? null, preferredLanguage: a.user.employee?.preferredLanguage ?? null, roles: codes }, readiness: readiness({ exists: true, active: a.user.isActive, locked: a.user.isLocked, roleValid, passwordReady: Boolean(a.user.passwordHash), enabled: a.isEnabled, mfa: a.user.mfaEnabled, pinActive: Boolean(a.user.activationPinHash) }) };
  };
  return NextResponse.json({ accounts: accounts.map(serialize), candidates: users.map((u) => ({ id: u.id, email: u.email, displayName: u.displayName, roles: u.roleAssignments.map((x) => x.role.code) })), roleOptions: DEMO_ROLE_OPTIONS });
}

export async function POST(req: NextRequest) {
  const session = await actor(req);
  if (!session) return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  const parsed = actionSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  const body = parsed.data;
  if (["passwordAll", "prepare"].includes(body.action) && !isDemoEnvironment()) return NextResponse.json({ message: "Bulk demo action disabled" }, { status: 403 });
  let event = "DEMO_ACCOUNT_UPDATED"; let targetUserId: string | null = "userId" in body ? body.userId : null; let activationPin: string | undefined;
  if (body.action === "assign") {
    const validRoles = DEMO_ROLE_OPTIONS[body.demoRole] as readonly string[];
    const user = await prisma.user.findFirst({ where: { id: body.userId, roleAssignments: { some: { status: "ACTIVE", role: { code: { in: [...validRoles] } } } } } });
    if (!user) return NextResponse.json({ message: "Role mismatch" }, { status: 409 });
    await prisma.demoAccount.upsert({ where: { demoRole: body.demoRole }, update: { userId: body.userId, updatedBy: session.sub }, create: { demoRole: body.demoRole, userId: body.userId, updatedBy: session.sub } }); event = "DEMO_ACCOUNT_ASSIGNED";
  } else if (body.action === "password" || body.action === "passwordAll") {
    if (!validateDemoPassword(body.password)) return NextResponse.json({ message: "Password policy failed" }, { status: 400 });
    const hash = await hashPassword(body.password);
    const ids = body.action === "passwordAll" ? (await prisma.demoAccount.findMany({ where: { isEnabled: true }, select: { userId: true } })).map((x) => x.userId) : [body.userId];
    await prisma.$transaction(async (tx) => {
      for (const id of ids) {
        const current = await tx.user.findUniqueOrThrow({ where: { id }, select: { passwordHash: true } });
        if (current.passwordHash) await tx.passwordHistory.create({ data: { userId: id, passwordHash: current.passwordHash } });
        await tx.user.update({ where: { id }, data: { passwordHash: hash, passwordChangedAt: new Date(), mustChangePassword: false, isLocked: false, lockedAt: null, authzVersion: { increment: 1 } } });
        await tx.userSession.updateMany({ where: { userId: id, status: "ACTIVE" }, data: { status: "REVOKED" } });
      }
    }); event = body.action === "passwordAll" ? "DEMO_ALL_PASSWORDS_RESET" : "DEMO_PASSWORD_RESET";
  } else if (body.action === "activationPin") {
    activationPin = generateActivationPin(); const pinHash = await hashActivationPin(activationPin); const expires = new Date(Date.now() + ACTIVATION_PIN_TTL_HOURS * 3600000);
    await prisma.$transaction([prisma.user.update({ where: { id: body.userId }, data: { activationPinHash: pinHash, activationPinExpiresAt: expires, activationPinUsedAt: null, activationPinAttempts: 0 } }), prisma.userSession.updateMany({ where: { userId: body.userId, status: "ACTIVE" }, data: { status: "REVOKED" } })]); event = "DEMO_ACTIVATION_PIN_ISSUED";
  } else if (body.action === "resetMfa") { await prisma.$transaction([prisma.user.update({ where: { id: body.userId }, data: { mfaEnabled: false, mfaSecret: null } }), prisma.mfaRecoveryCode.deleteMany({ where: { userId: body.userId } }), prisma.userSession.updateMany({ where: { userId: body.userId, status: "ACTIVE" }, data: { status: "REVOKED" } })]); event = "DEMO_MFA_RESET";
  } else if (body.action === "language") { await prisma.user.update({ where: { id: body.userId }, data: { employee: { update: { preferredLanguage: body.language } } } }); event = "DEMO_LANGUAGE_UPDATED";
  } else if (body.action === "logout") { await prisma.userSession.updateMany({ where: { userId: body.userId, status: "ACTIVE" }, data: { status: "REVOKED" } }); event = "DEMO_SESSIONS_INVALIDATED";
  } else if (body.action === "prepare") {
    const ids = (await prisma.demoAccount.findMany({ where: { isEnabled: true }, select: { userId: true } })).map((item) => item.userId);
    await prisma.$transaction([
      prisma.user.updateMany({ where: { id: { in: ids } }, data: { isActive: true, isLocked: false, lockedAt: null, activationPinAttempts: 0 } }),
      prisma.userSession.updateMany({ where: { userId: { in: ids }, status: "ACTIVE" }, data: { status: "REVOKED" } }),
    ]);
    event = "DEMO_ACCOUNTS_PREPARED";
  } else { const data = body.action === "unlock" ? { isLocked: false, lockedAt: null, activationPinAttempts: 0 } : body.action === "enable" ? { isActive: true } : body.action === "disable" ? { isActive: false } : { activationPinHash: null, activationPinExpiresAt: null, activationPinUsedAt: null, activationPinAttempts: 0 }; await prisma.user.update({ where: { id: body.userId }, data }); event = `DEMO_ACCOUNT_${body.action.toUpperCase()}`; }
  await AuditService.log({ userId: session.sub, action: event, entity: "DemoAccount", entityId: targetUserId, metadata: { targetUserId }, req });
  const response = NextResponse.json({ ok: true, activationPin }); response.headers.set("Cache-Control", "no-store"); return response;
}
