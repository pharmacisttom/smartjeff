import { prisma } from "@/lib/prisma";

export interface QHSERiskInsight {
  type: "CAPA_OVERDUE" | "REPEAT_INCIDENT" | "HIGH_RISK_REGISTER" | "INSPECTION_FAILURE";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  title: string;
  description: string;
  count: number;
  explanation: string;
  actionRequired: string;
}

export class QHSEIntelligenceService {
  /**
   * Analyzes QHSE records for overdue CAPA, repeat incidents, and risk trends.
   */
  static async analyzeRiskInsights(): Promise<QHSERiskInsight[]> {
    const insights: QHSERiskInsight[] = [];
    const now = new Date();

    // 1. Overdue CAPAs
    const overdueCapas = await prisma.cAPA.findMany({
      where: { status: "OPEN", dueDate: { lt: now } },
    });

    if (overdueCapas.length > 0) {
      insights.push({
        type: "CAPA_OVERDUE",
        severity: overdueCapas.length > 3 ? "CRITICAL" : "HIGH",
        title: "พบมาตรการแก้ไขและป้องกัน (CAPA) เกินกำหนดเวลา",
        description: `มีรายการ CAPA คงค้างเกินกำหนดจำนวน ${overdueCapas.length} รายการ`,
        count: overdueCapas.length,
        explanation: `จากการตรวจสอบตาราง CAPA พบว่ามี ${overdueCapas.length} รายการที่ยังไม่ได้ปิดและเลยกำหนดวันที่แก้ไข`,
        actionRequired: "เร่งรัดให้ผู้รับผิดชอบติดตามและอัปเดตหลักฐานการแก้ไขทันที",
      });
    }

    // 2. High risk register entries
    const highRisks = await prisma.risk.findMany({
      where: { status: "OPEN", level: { in: ["HIGH", "CRITICAL"] } },
    });

    if (highRisks.length > 0) {
      insights.push({
        type: "HIGH_RISK_REGISTER",
        severity: "HIGH",
        title: "พบความเสี่ยงระดับสูงใน Risk Register",
        description: `พบความเสี่ยงระดับสูง/วิกฤตที่เปิดอยู่จำนวน ${highRisks.length} รายการ`,
        count: highRisks.length,
        explanation: `ความเสี่ยงระดับสูงได้รับการประเมินตามเกณฑ์ โอกาสเกิด x ผลกระทบ >= 15`,
        actionRequired: "ทบทวนมาตรการลดความเสี่ยง (Mitigation Plan) ร่วมกับผู้บริหารไซต์",
      });
    }

    return insights;
  }
}
