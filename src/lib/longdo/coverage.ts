/**
 * Longdo Coverage Area Service Integration Layer
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

import { LONGDO_CONFIG, recordLongdoApiRequest } from "./config";
import { CoverageAreaResult, LatLng } from "./types";
import { LongdoMapError, LongdoKeyMissingError } from "./errors";

export async function calculateCoverageAreaLongdo(
  center: LatLng,
  value: number = 30, // 30 mins or 10000 meters
  mode: "time" | "distance" = "time"
): Promise<CoverageAreaResult> {
  const apiKey = LONGDO_CONFIG.serverKey;
  if (!apiKey) {
    throw new LongdoKeyMissingError("SERVER");
  }

  const url = `${LONGDO_CONFIG.endpoints.coverage}?lat=${center.lat}&lon=${center.lng}&${
    mode === "time" ? "time" : "distance"
  }=${value}&key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = await response.json();
      recordLongdoApiRequest("coverageArea", true);

      if (Array.isArray(data.polygon)) {
        const polygon: LatLng[] = data.polygon.map((pt: any) => ({
          lat: Number(pt.lat || pt[1]),
          lng: Number(pt.lon || pt.lng || pt[0]),
        }));
        return { center, mode, value, polygon };
      }
    }
    recordLongdoApiRequest("coverageArea", false);
  } catch (_) {
    recordLongdoApiRequest("coverageArea", false);
  }

  // Fallback: Generate circular polygon approximation (32 points)
  const radiusMeters = mode === "distance" ? value : value * 60 * 11.1; // ~40km/h
  const polygon: LatLng[] = [];
  const numPoints = 32;
  const earthRadius = 6371000;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i * 2 * Math.PI) / numPoints;
    const dLat = (radiusMeters / earthRadius) * (180 / Math.PI) * Math.cos(angle);
    const dLng =
      ((radiusMeters / earthRadius) * (180 / Math.PI) * Math.sin(angle)) /
      Math.cos((center.lat * Math.PI) / 180);
    polygon.push({
      lat: center.lat + dLat,
      lng: center.lng + dLng,
    });
  }

  return { center, mode, value, polygon };
}
