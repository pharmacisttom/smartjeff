import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const site = await prisma.site.findUnique({
      where: { id: params.id },
      include: {
        employees: true,
        config: true,
      },
    });
    if (!site) return NextResponse.json({ message: "ไม่พบข้อมูลไซต์งาน" }, { status: 404 });
    return NextResponse.json({ site });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { code, name, location, lat, lng, radius, workStart, workEnd, otStart, otEnd } = body;

    const site = await prisma.site.update({
      where: { id: params.id },
      data: {
        code,
        name,
        location,
        lat: lat !== undefined ? parseFloat(lat) : undefined,
        lng: lng !== undefined ? parseFloat(lng) : undefined,
        radius: radius !== undefined ? parseInt(radius) : undefined,
        workStart: workStart !== undefined ? parseFloat(workStart) : undefined,
        workEnd: workEnd !== undefined ? parseFloat(workEnd) : undefined,
        otStart: otStart !== undefined ? parseFloat(otStart) : undefined,
        otEnd: otEnd !== undefined ? parseFloat(otEnd) : undefined,
      },
    });

    return NextResponse.json({ site, message: "อัปเดตข้อมูลไซต์งานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.site.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "ลบไซต์งานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
