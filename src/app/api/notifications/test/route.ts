import { NextRequest, NextResponse } from "next/server";
import { sendLineNotify } from "@/lib/notification/line-notify";
import { sendTelegramBotMessage } from "@/lib/notification/telegram";
import { sendEmailDigest } from "@/lib/notification/email";
import { generateDailyExecutiveReport } from "@/lib/automation/daily-report";

export async function POST(req: NextRequest) {
  try {
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
      result = await sendLineNotify(token || "DEMO_LINE_TOKEN", formattedMessage);
    } else if (type === "TELEGRAM") {
      const htmlMsg = `<b>📊 SMARTO Executive Daily Report</b>\n<code>${report.reportDate}</code>\n\n👥 <b>เข้างาน:</b> ${report.presentCount}/${report.totalEmployees} คน\n⏰ <b>มาสาย:</b> ${report.lateCount} คน\n⏱️ <b>OT รวม:</b> ${report.otHours} ชม.\n💰 <b>ค่าใช้จ่ายรวม:</b> ฿${report.estimatedLaborCost.toLocaleString()}\n⚠️ <b>นอกพื้นที่:</b> ${report.outsideGeofenceAlerts} รายการ\n\n💡 <i>${report.aiSummaryText}</i>`;
      result = await sendTelegramBotMessage(token || "DEMO_BOT_TOKEN", chatId || "DEMO_CHAT_ID", htmlMsg);
    } else if (type === "EMAIL") {
      result = await sendEmailDigest([email || "executives@j2k.co.th"], `📊 สรุปผลประจำวัน ${report.reportDate}`, formattedMessage);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "เกิดข้อผิดพลาดในการส่งการแจ้งเตือน" },
      { status: 500 }
    );
  }
}
