/**
 * Longdo Route & Forecast Routing Service Integration Layer
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

import { LONGDO_CONFIG, recordLongdoApiRequest } from "./config";
import { LatLng, LongdoRouteResult, RouteGuideStep } from "./types";
import { LongdoMapError, LongdoKeyMissingError } from "./errors";
import { haversineDistance } from "../geo/haversine";

export async function calculateRouteLongdo(
  origin: LatLng,
  destination: LatLng,
  options?: {
    mode?: "t" | "m" | "w" | "p"; // t=car, m=motorcycle, w=walk, p=public transport
    routeType?: 0 | 1 | 25; // 0=main road, 1=shortest, 25=avoid traffic
    departureTime?: string; // Forecast routing ISO timestamp
  }
): Promise<LongdoRouteResult> {
  const apiKey = LONGDO_CONFIG.serverKey;
  if (!apiKey) {
    throw new LongdoKeyMissingError("SERVER");
  }

  const mode = options?.mode || "t";
  const type = options?.routeType ?? 0;

  let url = `${LONGDO_CONFIG.endpoints.route}?flat=${origin.lat}&flon=${origin.lng}&tlat=${destination.lat}&tlon=${destination.lng}&mode=${mode}&type=${type}&key=${encodeURIComponent(
    apiKey
  )}&locale=th`;

  if (options?.departureTime) {
    url += `&time=${encodeURIComponent(options.departureTime)}`;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      recordLongdoApiRequest("route", false);
      throw new LongdoMapError(`Longdo route HTTP error ${response.status}`, "ROUTE_HTTP_ERROR", response.status);
    }

    const data = await response.json();
    recordLongdoApiRequest("route", true);

    let distanceMeters = 0;
    let durationSeconds = 0;
    const polyline: LatLng[] = [];
    const steps: RouteGuideStep[] = [];

    // Parse Longdo Route JSON format
    if (data.meta) {
      distanceMeters = Number(data.meta.distance || data.meta.dist || 0);
      durationSeconds = Number(data.meta.duration || data.meta.time || 0);
    }

    if (Array.isArray(data.data)) {
      data.data.forEach((leg: any) => {
        if (!distanceMeters && leg.distance) distanceMeters += Number(leg.distance);
        if (!durationSeconds && leg.interval) durationSeconds += Number(leg.interval);

        if (leg.location) {
          polyline.push({
            lat: Number(leg.location.lat || leg.location.latitude),
            lng: Number(leg.location.lon || leg.location.longitude || leg.location.lng),
          });
        }

        if (Array.isArray(leg.guide)) {
          leg.guide.forEach((g: any) => {
            steps.push({
              instruction: g.name || g.instruction || "เดินทางตามเส้นทาง",
              turn: g.turn,
              distanceMeters: Number(g.distance || 0),
              durationSeconds: Number(g.interval || 0),
            });
          });
        }
      });
    }

    // Fallback polyline if missing in response
    if (polyline.length === 0) {
      polyline.push(origin, destination);
    }

    // Fallback distance calculation if API returned 0
    if (distanceMeters === 0) {
      const direct = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      distanceMeters = Math.round(direct * 1.25);
      durationSeconds = Math.round(distanceMeters / 11.1); // ~40km/h
    }

    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
    const durationMinutes = Math.round(durationSeconds / 60);

    return {
      distanceMeters,
      distanceKm,
      durationSeconds,
      durationMinutes,
      polyline,
      steps: steps.length > 0 ? steps : [
        { instruction: "เริ่มต้นจากจุดมุ่งหมาย", distanceMeters: Math.round(distanceMeters * 0.4), durationSeconds: Math.round(durationSeconds * 0.4) },
        { instruction: "มุ่งหน้าสู่ปลายทางตามเส้นทางหลัก", distanceMeters: Math.round(distanceMeters * 0.6), durationSeconds: Math.round(durationSeconds * 0.6) },
      ],
      mode,
    };
  } catch (err: any) {
    if (err instanceof LongdoMapError) throw err;
    recordLongdoApiRequest("route", false);

    // Fallback route result calculation
    const direct = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
    const distanceMeters = Math.round(direct * 1.25);
    const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
    const durationSeconds = Math.round(distanceMeters / 11.1);
    const durationMinutes = Math.round(durationSeconds / 60);

    return {
      distanceMeters,
      distanceKm,
      durationSeconds,
      durationMinutes,
      polyline: [origin, destination],
      steps: [
        { instruction: "เส้นทางโดยประมาณจากระบบสำรอง", distanceMeters, durationSeconds },
      ],
      mode: options?.mode || "t",
    };
  }
}
