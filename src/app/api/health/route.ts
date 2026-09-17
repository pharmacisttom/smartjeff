import { NextResponse } from "next/server";
import { platformHealthService } from "@/server/platform/health/platform-health.service";

export async function GET() {
  const liveness = platformHealthService.getLiveness();
  const readiness = await platformHealthService.getReadiness();

  const isHealthy = readiness.ready;
  return NextResponse.json(
    {
      status: isHealthy ? "HEALTHY" : "UNHEALTHY",
      uptimeSeconds: liveness.uptimeSeconds,
      timestamp: liveness.timestamp,
      checks: readiness.checks,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
