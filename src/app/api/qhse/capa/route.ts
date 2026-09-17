import { NextRequest, NextResponse } from "next/server";
import { CAPAService } from "@/server/services/qhse/capa.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const ownerId = searchParams.get("ownerId") || undefined;
    const actionType = searchParams.get("actionType") || undefined;
    const priority = searchParams.get("priority") || undefined;
    const isOverdueOnly = searchParams.get("isOverdueOnly") === "true";
    const take = parseInt(searchParams.get("take") || "50", 10);
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const result = await CAPAService.getCAPAs({
      status,
      ownerId,
      actionType,
      priority,
      isOverdueOnly,
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

    if (body.action === "VERIFY") {
      if (!body.capaId || !body.verifiedBy) {
        return NextResponse.json({ error: "capaId and verifiedBy are required" }, { status: 400 });
      }
      const verified = await CAPAService.verifyCAPA(
        body.capaId,
        body.verifiedBy,
        body.notes || "Verified OK",
        body.enforceSeparationOfDuties !== false
      );
      return NextResponse.json(verified);
    }

    if (body.action === "CLOSE") {
      if (!body.capaId || !body.performedBy) {
        return NextResponse.json({ error: "capaId and performedBy are required" }, { status: 400 });
      }
      const closed = await CAPAService.closeCAPA(body.capaId, body.performedBy);
      return NextResponse.json(closed);
    }

    if (body.action === "EFFECTIVENESS_REVIEW") {
      if (!body.capaId || !body.reviewedBy || !body.status) {
        return NextResponse.json({ error: "capaId, reviewedBy, and status are required" }, { status: 400 });
      }
      const reviewed = await CAPAService.recordEffectivenessReview(
        body.capaId,
        body.reviewedBy,
        body.status,
        body.notes || ""
      );
      return NextResponse.json(reviewed);
    }

    if (!body.title || !body.description || !body.ownerId || !body.dueDate) {
      return NextResponse.json({ error: "title, description, ownerId, and dueDate are required" }, { status: 400 });
    }

    const capa = await CAPAService.createCAPA({
      findingId: body.findingId,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
      title: body.title,
      description: body.description,
      actionType: body.actionType,
      ownerId: body.ownerId,
      dueDate: new Date(body.dueDate),
      priority: body.priority,
      verificationMethod: body.verificationMethod,
    });

    return NextResponse.json(capa, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
