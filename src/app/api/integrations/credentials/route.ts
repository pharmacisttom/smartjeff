import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { integrationCredentialService } from "@/server/automation/integrations/integration-credential.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const credentials = await prisma.integrationCredential.findMany({
      select: {
        id: true,
        name: true,
        clientId: true,
        scopesJson: true,
        expiresAt: true,
        rateLimitPerMin: true,
        status: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const parsed = credentials.map((c) => ({
      ...c,
      scopes: JSON.parse(c.scopesJson || "[]"),
    }));

    return NextResponse.json({ success: true, credentials: parsed });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, scopes, expiresInDays, rateLimitPerMin } = body;

    if (!name || !scopes || !Array.isArray(scopes)) {
      return NextResponse.json(
        { success: false, error: "name and scopes (array) are required" },
        { status: 400 }
      );
    }

    const result = await integrationCredentialService.createCredential({
      name,
      scopes,
      expiresInDays,
      rateLimitPerMin,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
