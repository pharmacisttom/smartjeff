import { NextRequest, NextResponse } from "next/server";
import { reverseGeocodeLongdo } from "@/lib/longdo/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const locale = searchParams.get("locale") || "th";

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "Missing required parameters: lat and lng" },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: "Invalid latitude or longitude" }, { status: 400 });
    }

    const result = await reverseGeocodeLongdo(lat, lng, locale);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("API /api/map/reverse-geocode Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to reverse geocode" },
      { status: err.status || 500 }
    );
  }
}
