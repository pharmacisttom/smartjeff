import { NextResponse } from "next/server";
import { platformHealthService } from "@/server/platform/health/platform-health.service";

export async function GET() {
  const live = platformHealthService.getLiveness();
  return NextResponse.json(live, { status: 200 });
}
