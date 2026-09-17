import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserForAI } from "@/server/ai/security/ai-auth-helper";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messageId, rating, reason } = body;

    if (!messageId || rating === undefined) {
      return NextResponse.json(
        { success: false, error: "messageId and rating (1 or -1) are required" },
        { status: 400 }
      );
    }

    const feedback = await prisma.aIFeedback.create({
      data: {
        messageId,
        userId: user.userId || "anonymous",
        rating: rating > 0 ? 1 : -1,
        reason: reason || null,
      },
    });

    return NextResponse.json({ success: true, feedback });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
