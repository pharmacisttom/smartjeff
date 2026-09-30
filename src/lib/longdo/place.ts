/**
 * Longdo Place Search & Suggest Service Integration Layer
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

import { LONGDO_CONFIG, recordLongdoApiRequest } from "./config";
import { LongdoPlaceItem, LongdoPlaceSearchResult, LongdoSuggestItem } from "./types";
import { LongdoMapError, LongdoKeyMissingError } from "./errors";

export async function searchPlacesLongdo(
  keyword: string,
  options?: {
    lat?: number;
    lng?: number;
    limit?: number;
    tag?: string;
  }
): Promise<LongdoPlaceSearchResult> {
  const apiKey = LONGDO_CONFIG.serverKey;
  if (!apiKey) {
    throw new LongdoKeyMissingError("SERVER");
  }

  const limit = options?.limit || 20;
  let url = `${LONGDO_CONFIG.endpoints.search}?keyword=${encodeURIComponent(
    keyword
  )}&key=${encodeURIComponent(apiKey)}&limit=${limit}`;

  if (options?.lat && options?.lng) {
    url += `&lat=${options.lat}&lon=${options.lng}`;
  }

  if (options?.tag) {
    url += `&tag=${encodeURIComponent(options.tag)}`;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 300 }, // Cache search queries for 5 minutes
    });

    if (!response.ok) {
      recordLongdoApiRequest("searchPlaces", false);
      throw new LongdoMapError(`Longdo place search HTTP ${response.status}`, "PLACE_SEARCH_HTTP_ERROR", response.status);
    }

    const data = await response.json();
    recordLongdoApiRequest("searchPlaces", true);

    const items = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
    const places: LongdoPlaceItem[] = items.map((item: any, idx: number) => ({
      id: String(item.id || item.poi_id || `place_${idx}`),
      name: item.name || item.title || item.word || keyword,
      address: item.address || item.formattedAddress || item.vicinity || "",
      subdistrict: item.subdistrict || "",
      district: item.district || "",
      province: item.province || "",
      postcode: item.postcode || "",
      phone: item.telephone || item.phone || "",
      website: item.url || item.website || "",
      lat: Number(item.lat || item.latitude || 0),
      lng: Number(item.lon || item.lng || item.longitude || 0),
      category: item.category || item.tag || "",
      distanceMeters: item.distance ? Number(item.distance) : undefined,
    })).filter((p: LongdoPlaceItem) => p.lat !== 0 && p.lng !== 0);

    return {
      keyword,
      total: places.length,
      places,
    };
  } catch (err: any) {
    if (err instanceof LongdoMapError) throw err;
    recordLongdoApiRequest("searchPlaces", false);
    return { keyword, total: 0, places: [] };
  }
}

export async function suggestPlacesLongdo(
  keyword: string,
  limit: number = 10
): Promise<LongdoSuggestItem[]> {
  const apiKey = LONGDO_CONFIG.serverKey;
  if (!apiKey) return [];

  const url = `${LONGDO_CONFIG.endpoints.suggest}?keyword=${encodeURIComponent(
    keyword
  )}&key=${encodeURIComponent(apiKey)}&limit=${limit}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      recordLongdoApiRequest("suggestPlaces", false);
      return [];
    }

    const data = await response.json();
    recordLongdoApiRequest("suggestPlaces", true);

    const items = Array.isArray(data.d) ? data.d : Array.isArray(data.data) ? data.data : [];
    return items.map((item: any) => ({
      word: item.w || item.word || item.name || "",
      category: item.c || item.category || "",
      lat: item.lat ? Number(item.lat) : undefined,
      lng: item.lon ? Number(item.lon) : undefined,
    }));
  } catch (_) {
    recordLongdoApiRequest("suggestPlaces", false);
    return [];
  }
}
