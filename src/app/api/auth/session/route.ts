import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";
import { AuthorizationService } from "@/server/services/authorization.service";
import { EmployeeSerializer } from "@/lib/serializers/employee.serializer";
import { findJ2KDirectoryUser } from "@/lib/j2k-directory";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  let user: any = null;
  try {
    const dbPromise = prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        authzVersion: true,
        employeeId: true,
        employee: {
          include: { site: true },
        },
      },
    });

    user = await Promise.race([
      dbPromise.catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 400)),
    ]);
  } catch (err) {
    console.warn("[SESSION] Database read bypassed:", err instanceof Error ? err.message : err);
  }

  // Check authzVersion invalidation if both are available
  if (user && session.authzVersion && session.authzVersion < user.authzVersion) {
    return NextResponse.json(
      { error: "SESSION_STALE", message: "สิทธิ์การใช้งานมีการเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่" },
      { status: 401 }
    );
  }

  const dirUser = findJ2KDirectoryUser(session.email || session.sub);
  const effectiveRole = (user?.role || session.role || dirUser?.role || "EMPLOYEE").toUpperCase();
  const effectiveEmail = user?.email || session.email || dirUser?.email || "";
  const effectiveName = user?.displayName || session.name || dirUser?.name || effectiveEmail;
  const isSuperAdmin =
    effectiveRole === "ADMIN" ||
    effectiveRole === "SUPERADMIN" ||
    effectiveRole === "EXECUTIVE" ||
    effectiveEmail === "admin@j2k.co.th" ||
    effectiveEmail === "panithan@j2k.co.th";

  let permissionsList: string[] = [];
  let rolesList: any[] = [];
  let primaryRole = effectiveRole;

  if (user) {
    try {
      const authzContext = await AuthorizationService.getUserContext(user.id);
      if (authzContext) {
        permissionsList = Array.from(authzContext.permissions);
        rolesList = authzContext.roles || [];
        primaryRole = rolesList[0]?.nameTh || user.role || effectiveRole;
      }
    } catch (e) {
      console.warn("[SESSION] AuthorizationService context warning:", e);
    }
  }

  if (permissionsList.length === 0) {
    if (isSuperAdmin) {
      permissionsList = ["ALL", "dashboard.read", "admin.read", "security.read", "payroll.read", "attendance.read"];
      rolesList = [{ id: "ADMIN", code: "SUPER_ADMIN", nameTh: "ผู้ดูแลระบบสูงสุด", level: 10, departmentType: "EXECUTIVE" }];
      primaryRole = "ผู้ดูแลระบบสูงสุด";
    } else if (effectiveRole === "HR") {
      permissionsList = dirUser?.permissions ? dirUser.permissions.split(",") : ["dashboard.read", "slip", "payroll", "attendance"];
      rolesList = [{ id: "HR", code: "HR_MANAGER", nameTh: "เจ้าหน้าที่ฝ่ายการเงินและบุคคล", level: 5, departmentType: "HR" }];
      primaryRole = "ฝ่ายการเงิน/เงินเดือน";
    } else if (effectiveRole === "COORDINATOR") {
      permissionsList = dirUser?.permissions ? dirUser.permissions.split(",") : ["dashboard.read", "attendance", "slip", "operations"];
      rolesList = [{ id: "COORDINATOR", code: "COORDINATOR", nameTh: "เจ้าหน้าที่ฝ่ายประสานงานไซต์", level: 4, departmentType: "COORDINATOR" }];
      primaryRole = "ฝ่ายประสานงานไซต์";
    } else if (effectiveRole === "SUPERVISOR") {
      permissionsList = dirUser?.permissions ? dirUser.permissions.split(",") : ["operations", "attendance", "attendance.read", "attendance.write"];
      rolesList = [{ id: "SUPERVISOR", code: "SITE_SUPERVISOR", nameTh: "หัวหน้างานประจำไซต์", level: 3, departmentType: "OPERATIONS" }];
      primaryRole = "หัวหน้างานประจำไซต์";
    } else {
      permissionsList = ["check-in", "leave", "payslip"];
      rolesList = [{ id: "EMPLOYEE", code: "EMPLOYEE", nameTh: "พนักงานประจำไซต์", level: 1, departmentType: "OPERATIONS" }];
      primaryRole = "พนักงานประจำไซต์";
    }
  }

  let serializedEmployee = null;
  if (user?.employee) {
    try {
      serializedEmployee = EmployeeSerializer.serialize(user.employee, null, user.employeeId);
    } catch {
      serializedEmployee = {
        id: user.employee.id,
        code: user.employee.code,
        fullName: `${user.employee.firstName} ${user.employee.lastName}`,
        position: user.employee.position,
      };
    }
  } else if (dirUser?.code) {
    serializedEmployee = {
      id: dirUser.code,
      code: dirUser.code,
      fullName: dirUser.name,
      position: dirUser.position || "พนักงาน",
    };
  }

  const siteInfo = user?.employee?.site || (dirUser?.siteCode ? { code: dirUser.siteCode, name: dirUser.siteCode } : null);

  return NextResponse.json({
    user: {
      id: user?.id || session.sub,
      email: effectiveEmail,
      name: effectiveName,
      role: effectiveRole,
      primaryRole,
      roles: rolesList,
      permissions: permissionsList,
      isSuperAdmin,
      isSecurityAdmin: isSuperAdmin,
      isPlatformAdmin: isSuperAdmin,
    },
    employee: serializedEmployee
      ? {
          id: serializedEmployee.id,
          code: serializedEmployee.code,
          name: serializedEmployee.fullName || serializedEmployee.name,
          position: serializedEmployee.position,
        }
      : null,
    site: siteInfo,
  });
}

