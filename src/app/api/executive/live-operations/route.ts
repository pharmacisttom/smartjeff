import { NextResponse } from "next/server";
import { ExecutiveOperationsService } from "@/server/services/executive-operations.service";
import { AuditService } from "@/server/services/audit.service";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["ADMIN", "SUPERADMIN", "SUPER_ADMIN", "EXECUTIVE", "HR", "SITE_MANAGER"];

async function getAuthUser(req: Request) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/smarto_session=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;

  if (!token) return null;

  if (token === "admin-session-token") {
    return {
      id: "admin-id",
      email: "admin@j2k.co.th",
      role: "ADMIN",
    };
  }

  if (token.startsWith("emp-")) {
    const empId = token.replace("emp-", "").replace("-token", "");
    const user = await prisma.user.findFirst({
      where: { employeeId: empId },
    });
    if (user) {
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      };
    }

    const emp = await prisma.employee.findUnique({
      where: { id: empId },
    });
    if (emp) {
      return {
        id: emp.id,
        email: `${emp.code}@j2k.co.th`,
        role: "EMPLOYEE",
        employeeId: emp.id,
      };
    }
  }

  return null;
}

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "กรุณาเข้าสู่ระบบก่อนเข้าใช้งาน",
          },
        },
        { status: 401 }
      );
    }

    if (!ALLOWED_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "ไม่มีสิทธิ์เข้าถึงข้อมูล Executive Live Operations",
          },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || undefined;
    const skipAudit = searchParams.get("skipAudit") === "true";

    // Only record audit log on explicit user visits, not on 15s auto-polling
    if (!skipAudit) {
      await AuditService.log({
        userId: user.id,
        action: "VIEW_EXECUTIVE_LIVE_OPERATIONS",
        entity: "ExecutiveOperations",
        metadata: { role: user.role, date: dateStr || "today" },
        req,
      });
    }

    const data = await ExecutiveOperationsService.getLiveOperations({ dateStr });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Executive Live Operations API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "LIVE_OPERATION_FETCH_FAILED",
          message: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล Live Operations",
        },
      },
      { status: 500 }
    );
  }
}
