import { NextResponse } from "next/server";
import { AuditService } from "@/server/services/audit.service";

export async function GET() {
  try {
    const logs = await AuditService.getLogs(30);
    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
