import { NextRequest, NextResponse } from "next/server";
import { infrastructureMetricsService } from "@/server/platform/metrics/infrastructure-metrics.service";

export async function GET(req: NextRequest) {
  // In production, can enforce authorization header or localhost-only check
  const authHeader = req.headers.get("authorization");
  const metricsSecret = process.env.METRICS_TOKEN;

  if (metricsSecret && authHeader !== `Bearer ${metricsSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const prometheusText = infrastructureMetricsService.generatePrometheusMetrics();
  return new NextResponse(prometheusText, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
