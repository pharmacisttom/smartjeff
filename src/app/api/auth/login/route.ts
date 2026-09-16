import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    // Check Admin login credentials (U: admin, P: Smartjeff2026)
    if (
      (cleanUser === "admin" || cleanUser === "admin@j2k.co.th") &&
      cleanPass === "Smartjeff2026"
    ) {
      return NextResponse.json({
        success: true,
        user: {
          id: "admin-id",
          email: "admin@j2k.co.th",
          name: "ผู้ดูแลระบบ (Admin)",
          role: "ADMIN",
        },
        redirectTo: "/admin/dashboard",
        message: "เข้าสู่ระบบในฐานะ Admin เรียบร้อยแล้ว",
      });
    }

    // Check Employee login credentials
    if (cleanPass === "Smartjeff2026" || cleanPass === "123456" || cleanUser.startsWith("emp")) {
      const employee = await prisma.employee.findFirst({
        where: {
          OR: [
            { code: { equals: username, mode: "insensitive" } },
            { phone: { equals: username } },
          ],
        },
        include: { site: true },
      });

      if (employee) {
        return NextResponse.json({
          success: true,
          user: {
            id: employee.id,
            code: employee.code,
            name: `${employee.firstName} ${employee.lastName}`,
            role: "EMPLOYEE",
            site: employee.site?.name,
          },
          redirectTo: "/check-in",
          message: `ยินดีต้อนรับคุณ ${employee.firstName} ${employee.lastName}`,
        });
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
