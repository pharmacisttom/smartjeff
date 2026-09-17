import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserForAI } from "@/server/ai/security/ai-auth-helper";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const conv = await prisma.aIConversation.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conv) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    // Check ownership if not admin
    if (user.role !== "ADMIN" && conv.userId !== user.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conv.id,
        title: conv.title,
        context: conv.context ? JSON.parse(conv.context) : null,
        createdAt: conv.createdAt.toISOString(),
        messages: conv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolsUsed: m.toolCalls ? JSON.parse(m.toolCalls) : [],
          evidence: m.evidence ? JSON.parse(m.evidence) : [],
          tokens: m.tokens,
          latencyMs: m.latencyMs,
          confidence: m.confidence,
          createdAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const conv = await prisma.aIConversation.findUnique({
      where: { id: params.id },
    });

    if (!conv) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && conv.userId !== user.userId) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.aIConversation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
