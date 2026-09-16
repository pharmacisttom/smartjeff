import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sites = await prisma.site.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ sites });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name, location, lat, lng, radius, workStart, workEnd, otStart, otEnd } = body;

    if (!code || !name) {
      return NextResponse.json({ message: "กรุณาระบุรหัสไซต์และชื่อโรงงาน/นิคมฯ" }, { status: 400 });
    }

    const site = await prisma.site.create({
      data: {
        code,
        name,
        location: location || null,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        radius: radius ? parseInt(radius) : 200,
        workStart: workStart ? parseFloat(workStart) : 7,
        workEnd: workEnd ? parseFloat(workEnd) : 16,
        otStart: otStart ? parseFloat(otStart) : 16,
        otEnd: otEnd ? parseFloat(otEnd) : 17,
      },
    });

    return NextResponse.json({ site, message: "เพิ่มไซต์งานใหม่เรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
