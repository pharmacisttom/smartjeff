import { NextRequest, NextResponse } from "next/server";
import { SafetyObservationService } from "@/server/services/qhse/safety-observation.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;
    const type = searchParams.get("type") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const take = parseInt(searchParams.get("take") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const result = await SafetyObservationService.getObservations({
      siteId,
      type,
      category,
      status,
      take,
      skip,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if batch sync for mobile offline mode
    if (Array.isArray(body.items)) {
      const syncResult = await SafetyObservationService.syncOfflineObservations(body.items);
      return NextResponse.json(syncResult, { status: 201 });
    }

    if (!body.location || !body.description) {
      return NextResponse.json({ error: "location and description are required" }, { status: 400 });
    }

    const observation = await SafetyObservationService.createObservation({
      siteId: body.siteId,
      type: body.type,
      category: body.category,
      location: body.location,
      description: body.description,
      photoUrl: body.photoUrl,
      isAnonymous: body.isAnonymous,
      reporterId: body.reporterId,
    });

    return NextResponse.json(observation, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
