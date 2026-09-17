import { NextResponse } from "next/server";
import { platformHealthService } from "@/server/platform/health/platform-health.service";

export async function GET() {
  const detailed = await platformHealthService.getDetailedHealth();
  // Sync to database catalog in background
  platformHealthService.syncServiceCatalog().catch(() => {});
  return NextResponse.json(detailed);
}
