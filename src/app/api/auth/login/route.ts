import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" },
        { status: 400 }
      );
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();
    const clientIp = AuditService.getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "Unknown Browser";

    // Check Admin login credentials (U: admin, P: Smartjeff2026)
    if (
      (cleanUser === "admin" || cleanUser === "admin@j2k.co.th") &&
      cleanPass === "Smartjeff2026"
    ) {
      // Log Audit Entry
      await AuditService.log({
        userId: "admin-id",
        action: "LOGIN",
        entity: "User",
        entityId: "admin-id",
        metadata: { role: "ADMIN", email: "admin@j2k.co.th", userAgent },
        req,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: "admin-id",
          email: "admin@j2k.co.th",
          name: "ผู้ดูแลระบบ (Admin)",
          role: "ADMIN",
          ipAddress: clientIp,
        },
        redirectTo: "/admin/dashboard",
        message: `เข้าสู่ระบบในฐานะ Admin เรียบร้อยแล้ว (IP: ${clientIp})`,
      });

      // Set Session Cookie for Middleware
      response.cookies.set("smarto_session", "admin-session-token", {
        httpOnly: true,
        path: "/",
        maxAge: 86400 * 7, // 7 days
      });

      return response;
    }

    // Check Employee login credentials
    if (cleanPass === "Smartjeff2026" || cleanPass === "123456" || cleanUser.startsWith("emp")) {
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { code: username },
            { phone: username },
          ],
        },
        include: { site: true },
      });

      if (employee) {
        // Log Audit Entry
        await AuditService.log({
          userId: employee.id,
          action: "LOGIN",
          entity: "Employee",
          entityId: employee.id,
          metadata: { role: "EMPLOYEE", code: employee.code, name: `${employee.firstName} ${employee.lastName}`, userAgent },
          req,
        });

        const response = NextResponse.json({
          success: true,
          user: {
            id: employee.id,
            code: employee.code,
            name: `${employee.firstName} ${employee.lastName}`,
            role: "EMPLOYEE",
            site: employee.site?.name,
            ipAddress: clientIp,
          },
          redirectTo: "/check-in",
          message: `ยินดีต้อนรับคุณ ${employee.firstName} ${employee.lastName} (IP: ${clientIp})`,
        });

        // Set Session Cookie for Middleware
        response.cookies.set("smarto_session", `emp-${employee.id}-token`, {
          httpOnly: true,
          path: "/",
          maxAge: 86400 * 7,
        });

        return response;
      }
    }

    // Invalid credentials
    return NextResponse.json(
      { message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { message: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์", error: error.message },
      { status: 500 }
    );
  }
}
