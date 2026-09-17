import { NextResponse } from "next/server";
import { SiteService } from "@/server/services/site.service";

export async function GET() {
  try {
    const sites = await SiteService.getAll();
    return NextResponse.json({ sites });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.code || !body.name) {
      return NextResponse.json({ message: "กรุณาระบุรหัสไซต์และชื่อโรงงาน/นิคมฯ" }, { status: 400 });
    }

    const site = await SiteService.create({
      code: body.code,
      name: body.name,
      location: body.location,
      lat: body.lat ? parseFloat(body.lat) : null,
      lng: body.lng ? parseFloat(body.lng) : null,
      radius: body.radius ? parseInt(body.radius) : 200,
      workStart: body.workStart ? parseFloat(body.workStart) : 7,
      workEnd: body.workEnd ? parseFloat(body.workEnd) : 16,
      otStart: body.otStart ? parseFloat(body.otStart) : 16,
      otEnd: body.otEnd ? parseFloat(body.otEnd) : 17,
      minimumWorkforce: body.minimumWorkforce !== undefined ? parseInt(body.minimumWorkforce) : 1,
      requiresSupervisor: body.requiresSupervisor !== undefined ? Boolean(body.requiresSupervisor) : false,
    });

    return NextResponse.json({ site, message: "เพิ่มไซต์งานใหม่เรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
