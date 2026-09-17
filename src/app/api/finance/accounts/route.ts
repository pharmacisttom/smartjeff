import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureFinanceBaselineData } from "@/server/finance/seed-finance";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await ensureFinanceBaselineData();
    const accounts = await prisma.financialAccount.findMany({
      orderBy: { accountCode: "asc" },
    });
    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
