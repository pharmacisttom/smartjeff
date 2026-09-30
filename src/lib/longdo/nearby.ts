/**
 * Longdo Nearby POI Service Integration Layer
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

import { LONGDO_CONFIG, recordLongdoApiRequest } from "./config";
import { LatLng, LongdoCategoryCode, LongdoPlaceItem } from "./types";
import { LongdoMapError, LongdoKeyMissingError } from "./errors";

export async function getNearbyPoiLongdo(
  center: LatLng,
  category: LongdoCategoryCode,
  limit: number = 10,
  radiusMeters: number = 10000
): Promise<LongdoPlaceItem[]> {
  const apiKey = LONGDO_CONFIG.serverKey;
  if (!apiKey) {
    throw new LongdoKeyMissingError("SERVER");
  }

  const url = `${LONGDO_CONFIG.endpoints.nearby}?lon=${center.lng}&lat=${center.lat}&tag=${encodeURIComponent(
    category
  )}&limit=${limit}&radius=${radiusMeters}&key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      recordLongdoApiRequest("nearbyPoi", false);
      throw new LongdoMapError(`Longdo nearby POI HTTP ${response.status}`, "NEARBY_HTTP_ERROR", response.status);
    }

    const data = await response.json();
    recordLongdoApiRequest("nearbyPoi", true);

    const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    return items.map((item: any, idx: number) => ({
      id: String(item.id || item.poi_id || `nearby_${category}_${idx}`),
      name: item.name || item.title || `${category.toUpperCase()} POI`,
      address: item.address || item.vicinity || "",
      lat: Number(item.lat || item.latitude || center.lat),
      lng: Number(item.lon || item.lng || item.longitude || center.lng),
      category: category,
      phone: item.telephone || item.phone || "",
      distanceMeters: item.distance ? Number(item.distance) : undefined,
    }));
  } catch (err: any) {
    if (err instanceof LongdoMapError) throw err;
    recordLongdoApiRequest("nearbyPoi", false);
    return [];
  }
}
