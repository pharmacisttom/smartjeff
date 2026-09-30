import { NextRequest, NextResponse } from "next/server";
import { calculateDistanceMatrixLongdo } from "@/lib/longdo/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origins, destinations, mode } = body;

    if (!Array.isArray(origins) || !Array.isArray(destinations) || origins.length === 0 || destinations.length === 0) {
      return NextResponse.json(
        { error: "Invalid origins or destinations array" },
        { status: 400 }
      );
    }

    const result = await calculateDistanceMatrixLongdo(origins, destinations, mode || "t");
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("API /api/map/matrix Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to calculate distance matrix" },
      { status: err.status || 500 }
    );
  }
}
