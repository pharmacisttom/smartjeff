import { NextResponse } from "next/server";
import { deploymentHealthService } from "@/server/platform/deploy/deployment-health.service";

export async function GET() {
  const info = deploymentHealthService.getVersionInfo();
  return NextResponse.json(info);
}
