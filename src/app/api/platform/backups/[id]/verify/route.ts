import { NextRequest, NextResponse } from "next/server";
import { restoreVerificationService } from "@/server/platform/restore/restore-verification.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await restoreVerificationService.verifyBackup(params.id);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
