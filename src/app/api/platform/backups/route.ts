import { NextResponse } from "next/server";
import { backupService } from "@/server/platform/backup/backup.service";

export async function GET() {
  const backups = await backupService.listBackups();
  return NextResponse.json({ backups });
}
