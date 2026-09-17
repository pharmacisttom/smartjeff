import { NextRequest, NextResponse } from "next/server";
import { CRMActivityService } from "@/server/services/crm/crm-activity.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = {
      leadId: searchParams.get("leadId") || undefined,
      opportunityId: searchParams.get("opportunityId") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
    };

    const activities = await CRMActivityService.getActivities(filter);
    return NextResponse.json({ success: true, data: activities });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.type || !body.subject || !body.scheduledAt || !body.ownerId) {
      return NextResponse.json(
        { success: false, error: "type, subject, scheduledAt and ownerId are required" },
        { status: 400 }
      );
    }

    const activity = await CRMActivityService.createActivity(body);
    return NextResponse.json({ success: true, data: activity }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
