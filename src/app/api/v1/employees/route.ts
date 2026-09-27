import { NextRequest, NextResponse } from "next/server";
import { validateApiKeyRequest } from "@/lib/apikey/middleware";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const key = await validateApiKeyRequest(req, "employees:read");
    if (!key) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    // Employee has no tenant relation; do not expose cross-tenant data to tenant keys.
    if (key.tenantId) return NextResponse.json({ error: "TENANT_SCOPE_UNSUPPORTED" }, { status: 403 });
    const data = await prisma.employee.findMany({ take: 100, orderBy: { id: "asc" },
      select: { id: true, code: true, firstName: true, lastName: true, position: true, isActive: true } });
    return NextResponse.json({ object: "list", data, has_more: data.length === 100 });
  } catch { return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 }); }
}

export async function POST(req: NextRequest) {
  const key = await validateApiKeyRequest(req, "employees:write").catch(() => null);
  if (!key) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  return NextResponse.json({ error: "Use the authorized employee management API" }, { status: 501 });
}
