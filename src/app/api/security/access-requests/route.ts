import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { AuthorizationService } from "@/server/services/authorization.service";
import { AuditService } from "@/server/services/audit.service";

export async function GET(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const requests = await prisma.accessRequest.findMany({
      include: {
        user: { select: { id: true, email: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const body = await req.json();
    const { targetRoleId, permissionCode, scopeType, scopeId, reason, durationDays } = body;

    if (!reason) {
      return NextResponse.json({ message: "กรุณาระบุเหตุผลความจำเป็นในการขอสิทธิ์" }, { status: 400 });
    }

    const request = await prisma.accessRequest.create({
      data: {
        userId: session.sub,
        targetRoleId: targetRoleId || null,
        permissionCode: permissionCode || null,
        scopeType: scopeType || "GLOBAL",
        scopeId: scopeId || null,
        reason: reason.trim(),
        durationDays: durationDays ? parseInt(durationDays, 10) : 30,
        status: "PENDING",
      },
    });

    await AuditService.log({
      userId: session.sub,
      action: "ACCESS_REQUESTED",
      entity: "AccessRequest",
      entityId: request.id,
      metadata: { targetRoleId, permissionCode, reason },
      req,
    });

    return NextResponse.json({ request, message: "ยื่นคำขอสิทธิ์เรียบร้อยแล้ว รอผู้ดูแลระบบพิจารณา" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const auth = await AuthorizationService.authorize({
      userId: session.sub,
      permission: "security.role.manage",
    });
    if (!auth.allowed) return NextResponse.json({ message: auth.reason }, { status: 403 });

    const body = await req.json();
    const { requestId, status, reviewNote } = body;

    if (!requestId || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ message: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const request = await prisma.accessRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return NextResponse.json({ message: "ไม่พบคำขอนี้" }, { status: 404 });

    const updated = await prisma.accessRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedBy: session.sub,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null,
      },
    });

    // If approved and targetRoleId was requested, create UserRoleAssignment
    if (status === "APPROVED" && request.targetRoleId) {
      const endAt = new Date(Date.now() + (request.durationDays || 30) * 24 * 60 * 60 * 1000);
      await prisma.userRoleAssignment.create({
        data: {
          userId: request.userId,
          roleId: request.targetRoleId,
          scopeType: request.scopeType || "GLOBAL",
          scopeId: request.scopeId,
          endAt,
          assignedBy: session.sub,
          reason: `Approved Access Request #${request.id}: ${request.reason}`,
          status: "ACTIVE",
        },
      });

      await AuthorizationService.invalidateUserSessions(request.userId);
    }

    await AuditService.log({
      userId: session.sub,
      action: status === "APPROVED" ? "ACCESS_REQUEST_APPROVED" : "ACCESS_REQUEST_REJECTED",
      entity: "AccessRequest",
      entityId: requestId,
      metadata: { targetUserId: request.userId, status, reviewNote },
      req,
    });

    return NextResponse.json({
      request: updated,
      message: status === "APPROVED" ? "อนุมัติคำขอสิทธิ์และมอบหมายบทบาทสำเร็จ" : "ปฏิเสธคำขอสิทธิ์เรียบร้อย",
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
