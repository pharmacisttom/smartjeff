import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {
      OR: [
        { type: { contains: "SOS" } },
        { type: { in: ["ACCIDENT", "MEDICAL", "FIRE", "SECURITY", "EMERGENCY"] } },
        { severity: "CRITICAL" },
      ],
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    const incidents = await prisma.incident.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      incidents,
      count: incidents.length,
      activeCount: incidents.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS" || i.status === "ACKNOWLEDGED").length,
    });
  } catch (error: any) {
    console.error("GET /api/sos error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const { type = "SOS", lat, lng, accuracy, message, address, siteId } = body;

    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ error: "Latitude and Longitude are required" }, { status: 400 });
    }

    // Resolve employee details if available
    let employee = null;
    let employeeName = session.email;
    let employeeCode = "";
    let employeePhone = "";
    let resolvedSiteId = siteId || null;

    if (session.sub) {
      const user = await prisma.user.findUnique({
        where: { id: session.sub },
        include: {
          employee: {
            include: { site: true },
          },
        },
      });

      if (user?.employee) {
        employee = user.employee;
        employeeName = `${employee.prefix || ""} ${employee.firstName} ${employee.lastName}`.trim();
        employeeCode = employee.code;
        employeePhone = employee.phone || "";
        if (!resolvedSiteId && employee.siteId) {
          resolvedSiteId = employee.siteId;
        }
      }
    }

    // Generate unique reference number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const refNo = `SOS-${dateStr}-${randSuffix}`;

    const locationText = address || `พิกัด GPS: ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)} ${accuracy ? `(ความแม่นยำ ±${Math.round(accuracy)}m)` : ""}`;

    // 1. Create incident in DB
    const incident = await prisma.incident.create({
      data: {
        refNo,
        title: `🚨 ขอความช่วยเหลือฉุกเฉิน [${type}] — ${employeeName}`,
        description: message
          ? `${message}\n\n[ข้อมูลแจ้งเหตุ: ${employeeName} (${employeeCode || "N/A"}) โทร: ${employeePhone || "ไม่ระบุ"}]`
          : `พนักงานกดปุ่ม SOS ฉุกเฉินประเภท ${type}`,
        type: `EMERGENCY_${type.toUpperCase()}`,
        severity: "CRITICAL",
        status: "OPEN",
        occurredAt: new Date(),
        location: locationText,
        affectedPerson: `${employeeName} ${employeeCode ? `(${employeeCode})` : ""}`.trim(),
        reportedById: session.sub || null,
        siteId: resolvedSiteId,
        photoUrls: JSON.stringify({
          lat: Number(lat),
          lng: Number(lng),
          accuracy: accuracy || null,
          phone: employeePhone,
        }),
      },
    });

    // 2. Broadcast notification to Admins and HR
    try {
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { in: ["SUPERADMIN", "ADMIN", "HR", "EXECUTIVE"] },
        },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        await prisma.notification.createMany({
          data: adminUsers.map((u) => ({
            userId: u.id,
            title: `🚨 สัญญาณ SOS ด่วน! (${type})`,
            body: `${employeeName} กำลังขอความช่วยเหลือฉุกเฉินที่ ${locationText}`,
            actionUrl: `/admin/dashboard?sos=${incident.id}`,
            isRead: false,
          })),
        });
      }
    } catch (notifErr) {
      console.warn("Could not broadcast notifications:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "ส่งสัญญาณขอความช่วยเหลือฉุกเฉินเรียบร้อยแล้ว เจ้าหน้าที่กำลังเข้าช่วยเหลือ",
      incident: {
        id: incident.id,
        refNo: incident.refNo,
        type,
        employeeName,
        lat: Number(lat),
        lng: Number(lng),
        status: incident.status,
        createdAt: incident.createdAt,
      },
    });
  } catch (error: any) {
    console.error("POST /api/sos error:", error);
    return NextResponse.json({ error: error.message || "Failed to trigger SOS alert" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, resolutionNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Incident ID and status are required" }, { status: 400 });
    }

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        status,
        description: resolutionNotes
          ? `${resolutionNotes}\n--- (อัปเดตสถานะเป็น ${status} โดย ${session.email} เมื่อ ${new Date().toLocaleString("th-TH")})`
          : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: `อัปเดตสถานะเหตุฉุกเฉินเป็น ${status} เรียบร้อยแล้ว`,
      incident: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/sos error:", error);
    return NextResponse.json({ error: error.message || "Failed to update SOS incident" }, { status: 500 });
  }
}
