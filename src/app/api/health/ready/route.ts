import { NextResponse } from "next/server";
import { platformHealthService } from "@/server/platform/health/platform-health.service";

export async function GET() {
  const ready = await platformHealthService.getReadiness();
  return NextResponse.json(ready, { status: ready.ready ? 200 : 503 });
}
