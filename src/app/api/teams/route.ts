import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, ALLOWED_EXECUTIVE_ROLES } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || !ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;

    const teams = await prisma.team.findMany({
      where: siteId ? { siteId } : {},
      include: {
        members: {
          include: {
            employee: {
              select: { id: true, code: true, firstName: true, lastName: true, position: true },
            },
          },
        },
        site: { select: { id: true, name: true, code: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, teams });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || !ALLOWED_EXECUTIVE_ROLES.includes(user.role.toUpperCase())) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.code || !body.name) {
      return NextResponse.json({ success: false, error: "Missing code or name" }, { status: 400 });
    }

    const team = await prisma.team.create({
      data: {
        code: body.code.toUpperCase().trim(),
        name: body.name.trim(),
        siteId: body.siteId,
        color: body.color || "#10B981",
        members: body.employeeIds?.length
          ? {
              create: body.employeeIds.map((empId: string) => ({
                employeeId: empId,
                role: "MEMBER",
              })),
            }
          : undefined,
      },
      include: { members: true },
    });

    return NextResponse.json({ success: true, team }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
