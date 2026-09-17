import { NextRequest, NextResponse } from "next/server";
import { restoreVerificationService } from "@/server/platform/restore/restore-verification.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await restoreVerificationService.verifyBackup(params.id);
    return NextResponse.json({
      success: result.verified,
      message: result.verified
        ? "Backup successfully restored into isolated temporary sandbox and verified."
        : "Restore verification check failed.",
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
