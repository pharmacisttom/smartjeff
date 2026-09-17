import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function authenticate(req: NextRequest) {
  const raw = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!raw) return null;
  const keyHash = createHash("sha256").update(raw).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
  if (!apiKey || apiKey.status !== "ACTIVE" || apiKey.revokedAt || (apiKey.expiresAt && apiKey.expiresAt < new Date())) return null;
  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  return apiKey;
}

export async function GET(req: NextRequest) {
  if (!await authenticate(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit")) || 50, 1), 200);
  const employees = await prisma.employee.findMany({ take: limit + 1, orderBy: { code: "asc" }, include: { site: { select: { id: true, code: true, name: true } } } });
  return NextResponse.json({ object: "list", data: employees.slice(0, limit), has_more: employees.length > limit });
}

export async function POST(req: NextRequest) {
  if (!await authenticate(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    if (!body.code || !body.firstName || !body.lastName || !body.position || !body.siteId) return NextResponse.json({ error: "code, firstName, lastName, position and siteId are required" }, { status: 400 });
    const employee = await prisma.employee.create({ data: { code: body.code, firstName: body.firstName, lastName: body.lastName, prefix: body.prefix || null, position: body.position, siteId: body.siteId, nationality: body.nationality || "ไทย", idCardNo: body.idCardNo || null, phone: body.phone || null } });
    return NextResponse.json(employee, { status: 201 });
  } catch (error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "CREATE_FAILED" }, { status: 400 }); }
}
