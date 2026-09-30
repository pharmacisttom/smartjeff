/**
 * Longdo Reverse Geocoding Service Integration Layer
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

import { LONGDO_CONFIG, recordLongdoApiRequest } from "./config";
import { LongdoAddressResult } from "./types";
import { LongdoMapError, LongdoKeyMissingError } from "./errors";

export async function reverseGeocodeLongdo(
  lat: number,
  lng: number,
  locale: string = "th"
): Promise<LongdoAddressResult> {
  const apiKey = LONGDO_CONFIG.serverKey;
  if (!apiKey) {
    throw new LongdoKeyMissingError("SERVER");
  }

  const url = `${LONGDO_CONFIG.endpoints.reverseGeocode}?lon=${lng}&lat=${lat}&key=${encodeURIComponent(
    apiKey
  )}&locale=${locale}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 }, // Cache reverse geocodes for 1 hour
    });

    if (!response.ok) {
      recordLongdoApiRequest("reverseGeocode", false);
      throw new LongdoMapError(
        `Longdo reverse geocode API HTTP error ${response.status}`,
        "REVERSE_GEOCODE_HTTP_ERROR",
        response.status
      );
    }

    const data = await response.json();
    recordLongdoApiRequest("reverseGeocode", true);

    const subdistrict = data.subdistrict || data.subdistrict_th || "";
    const district = data.district || data.district_th || "";
    const province = data.province || data.province_th || "";
    const postcode = data.postcode || "";
    const road = data.road || data.road_th || "";
    const aoi = data.aoi || "";

    const parts = [aoi, road, subdistrict, district, province, postcode].filter(Boolean);
    const formattedAddress = parts.length > 0 ? parts.join(" ") : `พิกัด ${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    return {
      subdistrict,
      district,
      province,
      postcode,
      country: data.country || "Thailand",
      aoi,
      road,
      formattedAddress,
      lat,
      lng,
      raw: data,
    };
  } catch (err: any) {
    if (err instanceof LongdoMapError) throw err;
    recordLongdoApiRequest("reverseGeocode", false);
    
    // Graceful fallback response when API fails
    return {
      formattedAddress: `พิกัด ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      lat,
      lng,
    };
  }
}
