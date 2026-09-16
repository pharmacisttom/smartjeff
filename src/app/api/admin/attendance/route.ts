import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const status = searchParams.get("status"); // "all" | "approved" | "pending"
    const dateStr = searchParams.get("date"); // YYYY-MM-DD

    const where: any = {};
    if (siteId && siteId !== "all") {
      where.employee = { siteId };
    }
    if (status === "pending") {
      where.isApproved = false;
    } else if (status === "approved") {
      where.isApproved = true;
    }

    if (dateStr) {
      const start = new Date(dateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateStr);
      end.setHours(23, 59, 59, 999);
      where.timestamp = { gte: start, lte: end };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: { site: true },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({ attendances });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { ids, action, approvedBy } = body; // action: "APPROVE" | "REJECT"

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "กรุณาระบุรายการลงเวลาที่ต้องการดำเนินการ" }, { status: 400 });
    }

    if (action === "APPROVE") {
      await prisma.attendance.updateMany({
        where: { id: { in: ids } },
        data: {
          isApproved: true,
          approvedBy: approvedBy || "HR Admin",
          approvedAt: new Date(),
        },
      });
      return NextResponse.json({ message: `อนุมัติการลงเวลาจำนวน ${ids.length} รายการแล้ว` });
    } else if (action === "REJECT") {
      await prisma.attendance.updateMany({
        where: { id: { in: ids } },
        data: {
          isApproved: false,
          approvedBy: approvedBy || "HR Admin",
          approvedAt: new Date(),
        },
      });
      return NextResponse.json({ message: `ปฏิเสธการลงเวลาจำนวน ${ids.length} รายการแล้ว` });
    }

    return NextResponse.json({ message: "คำสั่งไม่อยู่ในเงื่อนไข" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
