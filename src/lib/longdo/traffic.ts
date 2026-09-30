/**
 * Longdo Traffic Service Integration Layer
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

import { LONGDO_CONFIG, recordLongdoApiRequest } from "./config";
import { LongdoMapError, LongdoKeyMissingError } from "./errors";

export interface TrafficIncident {
  id: string;
  title: string;
  description: string;
  type: string; // incident, congestion, roadwork
  lat: number;
  lng: number;
  startTime?: string;
  endTime?: string;
}

export async function getTrafficIncidentsLongdo(
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): Promise<TrafficIncident[]> {
  const apiKey = LONGDO_CONFIG.serverKey;
  if (!apiKey) {
    throw new LongdoKeyMissingError("SERVER");
  }

  let url = `${LONGDO_CONFIG.endpoints.traffic}?key=${encodeURIComponent(apiKey)}`;
  if (bounds) {
    url += `&minlat=${bounds.minLat}&maxlat=${bounds.maxLat}&minlon=${bounds.minLng}&maxlon=${bounds.maxLng}`;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 180 }, // Cache traffic for 3 minutes
    });

    if (!response.ok) {
      recordLongdoApiRequest("trafficIncidents", false);
      return [];
    }

    const data = await response.json();
    recordLongdoApiRequest("trafficIncidents", true);

    const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    return items.map((item: any, idx: number) => ({
      id: String(item.id || `traffic_${idx}`),
      title: item.title || item.name || "รายงานสภาพการจราจร",
      description: item.detail || item.description || "",
      type: item.type || "congestion",
      lat: Number(item.lat || item.latitude || 0),
      lng: Number(item.lon || item.lng || item.longitude || 0),
      startTime: item.start_time,
      endTime: item.end_time,
    }));
  } catch (_) {
    recordLongdoApiRequest("trafficIncidents", false);
    return [];
  }
}
