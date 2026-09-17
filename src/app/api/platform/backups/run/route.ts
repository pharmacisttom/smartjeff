import { NextRequest, NextResponse } from "next/server";
import { backupService } from "@/server/platform/backup/backup.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const backup = await backupService.createBackup({
      backupType: body.backupType,
      destination: body.destination,
      retentionDays: body.retentionDays,
      encrypt: body.encrypt,
    });
    return NextResponse.json({ success: true, backup });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
