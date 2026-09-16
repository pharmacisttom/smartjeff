import { NextResponse } from "next/server";
import { SiteService } from "@/server/services/site.service";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const site = await SiteService.getById(params.id);
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
    const site = await SiteService.update(params.id, body);
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
    await SiteService.delete(params.id);
    return NextResponse.json({ message: "ลบไซต์งานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
