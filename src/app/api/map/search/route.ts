import { NextRequest, NextResponse } from "next/server";
import { searchPlacesLongdo } from "@/lib/longdo/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") || searchParams.get("q") || "";
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const limitStr = searchParams.get("limit");
    const tag = searchParams.get("tag") || undefined;

    if (!keyword.trim()) {
      return NextResponse.json({ keyword: "", total: 0, places: [] });
    }

    const options: any = {
      limit: limitStr ? parseInt(limitStr, 10) : 20,
      tag,
    };

    if (latStr && lngStr) {
      options.lat = parseFloat(latStr);
      options.lng = parseFloat(lngStr);
    }

    const result = await searchPlacesLongdo(keyword, options);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("API /api/map/search Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to search places" },
      { status: err.status || 500 }
    );
  }
}
