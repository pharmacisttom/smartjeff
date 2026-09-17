import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserForAI } from "@/server/ai/security/ai-auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: { userId: user.userId || "anonymous" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt.toISOString(),
        lastMessage: c.messages[0]?.content || "",
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const conv = await prisma.aIConversation.create({
      data: {
        userId: user.userId || "anonymous",
        title: body.title || "การสนทนาใหม่",
        context: body.context ? JSON.stringify(body.context) : null,
      },
    });

    return NextResponse.json({ success: true, conversation: conv });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
