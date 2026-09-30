/**
 * Longdo Distance Matrix Service Integration Layer
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

import { LONGDO_CONFIG, recordLongdoApiRequest } from "./config";
import { DistanceMatrixItem, DistanceMatrixResult, LatLng } from "./types";
import { LongdoMapError, LongdoKeyMissingError } from "./errors";
import { haversineDistance } from "../geo/haversine";

export async function calculateDistanceMatrixLongdo(
  origins: LatLng[],
  destinations: LatLng[],
  mode: string = "t"
): Promise<DistanceMatrixResult> {
  const apiKey = LONGDO_CONFIG.serverKey;
  if (!apiKey) {
    throw new LongdoKeyMissingError("SERVER");
  }

  if (origins.length === 0 || destinations.length === 0) {
    return { origins, destinations, matrix: [] };
  }

  const flats = origins.map((o) => o.lat).join(",");
  const flons = origins.map((o) => o.lng).join(",");
  const tlats = destinations.map((d) => d.lat).join(",");
  const tlons = destinations.map((d) => d.lng).join(",");

  const url = `${LONGDO_CONFIG.endpoints.matrix}?flat=${flats}&flon=${flons}&tlat=${tlats}&tlon=${tlons}&mode=${mode}&key=${encodeURIComponent(
    apiKey
  )}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      recordLongdoApiRequest("distanceMatrix", false);
      throw new LongdoMapError(`Longdo distance matrix HTTP ${response.status}`, "MATRIX_HTTP_ERROR", response.status);
    }

    const data = await response.json();
    recordLongdoApiRequest("distanceMatrix", true);

    const matrixResult: DistanceMatrixItem[][] = [];

    origins.forEach((orig, oIdx) => {
      const row: DistanceMatrixItem[] = [];
      destinations.forEach((dest, dIdx) => {
        let dist = 0;
        let dur = 0;
        if (data.data && data.data[oIdx] && data.data[oIdx][dIdx]) {
          const item = data.data[oIdx][dIdx];
          dist = Number(item.distance || item.dist || 0);
          dur = Number(item.duration || item.time || 0);
        }

        if (dist === 0) {
          const direct = haversineDistance(orig.lat, orig.lng, dest.lat, dest.lng);
          dist = Math.round(direct * 1.25);
          dur = Math.round(dist / 11.1);
        }

        row.push({
          originIndex: oIdx,
          destinationIndex: dIdx,
          distanceMeters: dist,
          durationSeconds: dur,
        });
      });
      matrixResult.push(row);
    });

    return {
      origins,
      destinations,
      matrix: matrixResult,
    };
  } catch (err: any) {
    if (err instanceof LongdoMapError) throw err;
    recordLongdoApiRequest("distanceMatrix", false);

    // Fallback: Compute matrix using Haversine * 1.25 road multiplier
    const matrixResult: DistanceMatrixItem[][] = origins.map((orig, oIdx) =>
      destinations.map((dest, dIdx) => {
        const direct = haversineDistance(orig.lat, orig.lng, dest.lat, dest.lng);
        const dist = Math.round(direct * 1.25);
        const dur = Math.round(dist / 11.1);
        return {
          originIndex: oIdx,
          destinationIndex: dIdx,
          distanceMeters: dist,
          durationSeconds: dur,
        };
      })
    );

    return {
      origins,
      destinations,
      matrix: matrixResult,
    };
  }
}
