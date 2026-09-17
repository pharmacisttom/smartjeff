import { NextResponse } from "next/server";
import { AICopilotService } from "@/server/ai/services/ai-copilot.service";
import { getAuthUserForAI } from "@/server/ai/security/ai-auth-helper";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getAuthUserForAI(req);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาเข้าสู่ระบบก่อนใช้งาน AI Operations Copilot",
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { message, conversationId, context } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "กรุณาระบุข้อความคำถาม (message is required)",
        },
        { status: 400 }
      );
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";

    const response = await AICopilotService.askCopilot(
      {
        message: message.trim(),
        conversationId,
        context,
      },
      user,
      ip
    );

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[POST /api/ai/copilot] Internal Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "เกิดข้อผิดพลาดในการประมวลผลของ AI Copilot",
      },
      { status: 500 }
    );
  }
}
