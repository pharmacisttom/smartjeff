import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("financialAccountId");
    const status = searchParams.get("status");

    const statements = await prisma.bankStatement.findMany({
      where: {
        ...(accountId ? { financialAccountId: accountId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { statementDate: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, statements });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch bank statements" },
      { status: 500 }
    );
  }
}
