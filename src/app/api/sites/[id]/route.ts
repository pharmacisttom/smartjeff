import { requireRole } from "@/lib/auth-jwt";
import { NextRequest, NextResponse } from "next/server";
import { SiteService } from "@/server/services/site.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: routeId } = await params;
  const auth = await requireRole(req, ["ADMIN", "SUPERADMIN", "HR", "SUPERVISOR", "COORDINATOR", "EMPLOYEE"]);
  if ("error" in auth) return auth.error;
  try {
    const site = await SiteService.getById(routeId);
    if (!site) return NextResponse.json({ message: "ไม่พบข้อมูลไซต์งาน" }, { status: 404 });
    return NextResponse.json({ site });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: routeId } = await params;
  const auth = await requireRole(req, ["ADMIN", "SUPERADMIN"]);
  if ("error" in auth) return auth.error;
  try {
    const body = await req.json();
    const site = await SiteService.update(routeId, body);
    return NextResponse.json({ site, message: "อัปเดตข้อมูลไซต์งานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: routeId } = await params;
  const auth = await requireRole(req, ["ADMIN", "SUPERADMIN"]);
  if ("error" in auth) return auth.error;
  try {
    await SiteService.delete(routeId);
    return NextResponse.json({ message: "ลบไซต์งานเรียบร้อยแล้ว" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
