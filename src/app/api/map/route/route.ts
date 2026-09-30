import { NextRequest, NextResponse } from "next/server";
import { calculateRouteLongdo } from "@/lib/longdo/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { origin, destination, mode, routeType, departureTime } = body;

    if (!origin?.lat || !origin?.lng || !destination?.lat || !destination?.lng) {
      return NextResponse.json(
        { error: "Invalid origin or destination coordinates" },
        { status: 400 }
      );
    }

    const result = await calculateRouteLongdo(origin, destination, {
      mode: mode || "t",
      routeType: routeType ?? 0,
      departureTime,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("API /api/map/route Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to calculate route" },
      { status: err.status || 500 }
    );
  }
}
