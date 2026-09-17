import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" } },
        { status: 401 }
      );
    }

    if (!ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึงข้อกำหนดกำลังคน" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;

    const requirements = await prisma.siteWorkforceRequirement.findMany({
      where: siteId ? { siteId, isActive: true } : { isActive: true },
      include: { site: { select: { id: true, code: true, name: true } } },
      orderBy: [{ siteId: "asc" }, { position: "asc" }],
    });

    return NextResponse.json({ success: true, requirements });
  } catch (error: any) {
    console.error("Get Requirements Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "FETCH_FAILED", message: error.message || "เกิดข้อผิดพลาดในการดึงข้อกำหนด" } },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" } },
        { status: 401 }
      );
    }

    if (!ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "ไม่มีสิทธิ์ตั้งค่าข้อกำหนดกำลังคน" } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { siteId, position, target, minimum, maximum, shift } = body;

    if (!siteId || !target) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "ต้องระบุ siteId และ target" } },
        { status: 400 }
      );
    }

    const requirement = await prisma.siteWorkforceRequirement.create({
      data: {
        siteId,
        position: position || null,
        target: parseInt(target),
        minimum: minimum ? parseInt(minimum) : 1,
        maximum: maximum ? parseInt(maximum) : null,
        shift: shift || "DAY",
      },
    });

    return NextResponse.json({ success: true, requirement, message: "บันทึกข้อกำหนดกำลังคนเรียบร้อยแล้ว" });
  } catch (error: any) {
    console.error("Save Requirement Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "SAVE_FAILED", message: error.message || "เกิดข้อผิดพลาดในการบันทึกข้อกำหนด" } },
      { status: 500 }
    );
  }
}
