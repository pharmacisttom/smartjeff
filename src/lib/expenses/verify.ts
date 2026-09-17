import { haversineDistance } from "../geo/haversine";

export interface ExpenseRouteItem {
  id: string;
  date: string;
  originName: string;
  destName: string;
  destLat: number;
  destLng: number;
  checkInLat?: number;
  checkInLng?: number;
  claimedKm: number;
  actualGpsKm?: number;
}

export interface VerificationAnomaly {
  type: "DISTANCE_MISMATCH" | "ENDPOINT_MISMATCH" | "DUPLICATE_ROUTE";
  severity: "high" | "medium" | "low";
  routeId: string;
  message: string;
}

export interface ExpenseVerificationResult {
  hasAnomalies: boolean;
  anomalyCount: number;
  matchScore: number; // 0.0 to 1.0 (1.0 = 100% matched)
  anomalies: VerificationAnomaly[];
}

export function verifyTravelExpenseClaim(
  routes: ExpenseRouteItem[]
): ExpenseVerificationResult {
  const anomalies: VerificationAnomaly[] = [];

  const seenDates = new Map<string, number>();

  for (const route of routes) {
    // 1. Check Distance Mismatch (>30% variance)
    if (route.actualGpsKm && route.actualGpsKm > 0) {
      const diffKm = Math.abs(route.claimedKm - route.actualGpsKm);
      const diffPercent = diffKm / route.claimedKm;

      if (diffPercent > 0.3) {
        anomalies.push({
          type: "DISTANCE_MISMATCH",
          severity: "high",
          routeId: route.id,
          message: `ระยะขอเบิก (${route.claimedKm} กม.) แตกต่างจากระยะ GPS ล็อกอินจริง (${route.actualGpsKm} กม.) เกิน 30%`,
        });
      }
    }

    // 2. Check Endpoint Mismatch (>500m distance from check-in GPS)
    if (route.checkInLat && route.checkInLng) {
      const distFromDest = haversineDistance(
        route.checkInLat,
        route.checkInLng,
        route.destLat,
        route.destLng
      );

      if (distFromDest > 500) {
        anomalies.push({
          type: "ENDPOINT_MISMATCH",
          severity: "medium",
          routeId: route.id,
          message: `จุดปลายทางในแผนต่างจากตำแหน่งสแกนเข้างานจริง ${Math.round(distFromDest)} เมตร`,
        });
      }
    }

    // 3. Check Duplicate Route
    const count = (seenDates.get(route.date) || 0) + 1;
    seenDates.set(route.date, count);

    if (count > 2) {
      anomalies.push({
        type: "DUPLICATE_ROUTE",
        severity: "high",
        routeId: route.id,
        message: `พบการยื่นขอเบิกค่าเดินทางซ้ำหลายรายการในวันเดียวกัน (${route.date})`,
      });
    }
  }

  const penaltySum = anomalies.reduce((sum, a) => {
    if (a.severity === "high") return sum + 0.25;
    if (a.severity === "medium") return sum + 0.15;
    return sum + 0.05;
  }, 0);

  const matchScore = Math.max(0, Math.round((1 - penaltySum) * 100) / 100);

  return {
    hasAnomalies: anomalies.length > 0,
    anomalyCount: anomalies.length,
    matchScore,
    anomalies,
  };
}
