import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, approvedBy } = body; // status: APPROVED | REJECTED

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ message: "สถานะการอนุมัติไม่ถูกต้อง" }, { status: 400 });
    }

    const updated = await prisma.leave.update({
      where: { id: params.id },
      data: {
        status,
        approvedBy: approvedBy || "HR Admin",
        approvedAt: new Date(),
      },
      include: { employee: true },
    });

    return NextResponse.json({
      leave: updated,
      message: status === "APPROVED" ? "อนุมัติใบลาเรียบร้อยแล้ว" : "ปฏิเสธใบลาเรียบร้อยแล้ว",
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
