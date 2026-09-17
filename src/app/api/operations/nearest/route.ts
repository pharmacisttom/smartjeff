import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findNearestCandidates } from "@/lib/geo/haversine";
import { requireRole } from "@/lib/auth-jwt";

const OPERATIONS_ROLES = ["SUPERADMIN", "ADMIN", "OPERATIONS"];

export async function GET(req: NextRequest) {
  const authorization = requireRole(req, OPERATIONS_ROLES);
  if ("error" in authorization) return authorization.error;
  const lat = Number(req.nextUrl.searchParams.get("lat"));
  const lng = Number(req.nextUrl.searchParams.get("lng"));
  const radius = Number(req.nextUrl.searchParams.get("radius") ?? 30_000);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius) || radius <= 0) {
    return NextResponse.json({ error: "Valid lat, lng, and radius are required" }, { status: 400 });
  }
  const latestLocations = await prisma.attendance.findMany({
    where: { employee: { isActive: true } },
    orderBy: { timestamp: "desc" },
    distinct: ["employeeId"],
    take: 500,
    include: { employee: { include: { site: true } } },
  });
  const candidates = findNearestCandidates(
    { lat, lng },
    latestLocations.map((record) => ({
      id: record.employeeId,
      name: `${record.employee.firstName} ${record.employee.lastName}`,
      lat: record.lat,
      lng: record.lng,
      site: record.employee.site.name,
    })),
    Math.min(radius, 100_000),
    5,
  );
  return NextResponse.json({ success: true, target: { lat, lng }, candidates });
}
