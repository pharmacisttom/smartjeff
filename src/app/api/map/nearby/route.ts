import { NextRequest, NextResponse } from "next/server";
import { getNearbyPoiLongdo, LongdoCategoryCode } from "@/lib/longdo/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const category = (searchParams.get("category") || "hospital") as LongdoCategoryCode;
    const limitStr = searchParams.get("limit");
    const radiusStr = searchParams.get("radius");

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "Missing required parameters: lat and lng" },
        { status: 400 }
      );
    }

    const center = {
      lat: parseFloat(latStr),
      lng: parseFloat(lngStr),
    };

    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const radiusMeters = radiusStr ? parseInt(radiusStr, 10) : 10000;

    const places = await getNearbyPoiLongdo(center, category, limit, radiusMeters);
    return NextResponse.json({ category, total: places.length, places });
  } catch (err: any) {
    console.error("API /api/map/nearby Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch nearby POIs" },
      { status: err.status || 500 }
    );
  }
}
