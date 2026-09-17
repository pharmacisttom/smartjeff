import { NextRequest, NextResponse } from "next/server";
import { sendLineNotify } from "@/lib/notification/line-notify";
import { sendTelegramBotMessage } from "@/lib/notification/telegram";
import { sendEmailDigest } from "@/lib/notification/email";
import { generateDailyExecutiveReport } from "@/lib/automation/daily-report";
import { requireRole } from "@/lib/auth-jwt";

export async function GET(req: NextRequest) {
  const auth = requireRole(req, ["SUPERADMIN", "ADMIN", "HR", "EXECUTIVE"]);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ channels: {
    line: Boolean(process.env.LINE_NOTIFY_TOKEN),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    email: Boolean(process.env.EMAIL_API_URL && process.env.EMAIL_API_KEY && process.env.EMAIL_FROM),
  } });
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireRole(req, ["SUPERADMIN", "ADMIN", "HR", "EXECUTIVE"]);
    if ("error" in auth) return auth.error;
    const body = await req.json();
    const { type, token, chatId, email, message } = body;

    const report = await generateDailyExecutiveReport();

    const formattedMessage = message || `📊 [SMARTO Daily Summary]
- วันที่: ${report.reportDate} (${report.tenantName})
- พนักงานเข้างาน: ${report.presentCount}/${report.totalEmployees} คน
- มาสาย: ${report.lateCount} คน | ลา: ${report.leaveCount} คน
- ชั่วโมง OT รวม: ${report.otHours} ชม. (ค่าใช้จ่าย ฿${report.otCost.toLocaleString()})
- นอกพื้นที่ Geofence: ${report.outsideGeofenceAlerts} รายการ
💡 AI Insight: ${report.aiSummaryText}`;

    let result = { success: false, message: "ประเภทช่องทางไม่ถูกต้อง" };

    if (type === "LINE_NOTIFY") {
      const credential = token || process.env.LINE_NOTIFY_TOKEN;
      if (!credential) return NextResponse.json({ success: false, message: "LINE_NOTIFY_TOKEN is not configured" }, { status: 503 });
      result = await sendLineNotify(credential, formattedMessage);
    } else if (type === "TELEGRAM") {
      const htmlMsg = `<b>📊 SMARTO Executive Daily Report</b>\n<code>${report.reportDate}</code>\n\n👥 <b>เข้างาน:</b> ${report.presentCount}/${report.totalEmployees} คน\n⏰ <b>มาสาย:</b> ${report.lateCount} คน\n⏱️ <b>OT รวม:</b> ${report.otHours} ชม.\n💰 <b>ค่าใช้จ่ายรวม:</b> ฿${report.estimatedLaborCost.toLocaleString()}\n⚠️ <b>นอกพื้นที่:</b> ${report.outsideGeofenceAlerts} รายการ\n\n💡 <i>${report.aiSummaryText}</i>`;
      const botToken = token || process.env.TELEGRAM_BOT_TOKEN;
      const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;
      if (!botToken || !targetChatId) return NextResponse.json({ success: false, message: "Telegram credentials are not configured" }, { status: 503 });
      result = await sendTelegramBotMessage(botToken, targetChatId, htmlMsg);
    } else if (type === "EMAIL") {
      if (!email) return NextResponse.json({ success: false, message: "Recipient email is required" }, { status: 400 });
      result = await sendEmailDigest([email], `Daily summary ${report.reportDate}`, formattedMessage);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "เกิดข้อผิดพลาดในการส่งการแจ้งเตือน" },
      { status: 500 }
    );
  }
}
