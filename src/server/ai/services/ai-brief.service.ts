import { OperationsIntelligenceService } from "@/server/services/operations-intelligence.service";
import { AIProviderFactory } from "../providers/ai-provider.factory";
import { PROMPT_VERSION, SYSTEM_OPERATIONS_COPILOT_PROMPT } from "../prompts/system-prompts";

export interface ExecutiveBriefResult {
  date: string;
  dataFreshness: string;
  briefText: string;
  metrics: Record<string, any>;
  promptVersion: string;
}

export class AIBriefService {
  /**
   * Generate Executive Daily Brief from structured intelligence data
   */
  static async generateDailyBrief(dateInput?: string): Promise<ExecutiveBriefResult> {
    const rawMetrics = await OperationsIntelligenceService.getExecutiveDailyBrief(dateInput);
    const provider = AIProviderFactory.getProvider();

    const prompt = `
สังเคราะห์สรุปสถานการณ์ปฏิบัติการยามเช้า (Executive Morning Brief) ประจำวันที่ ${rawMetrics.date}
ข้อมูลตัวชี้วัดจริงจากระบบ SmartJeff:
- ไซต์งานทั้งหมด: ${rawMetrics.totalSites} ไซต์ (เปิดทำการ ${rawMetrics.activeSites} ไซต์, ว่าง ${rawMetrics.emptySites} ไซต์)
- ไซต์ที่มีแจ้งเตือนความเสี่ยง: ${rawMetrics.alertSitesCount} ไซต์
- พนักงานกำลังปฏิบัติงานจริง: ${rawMetrics.totalWorkingEmployees} คน
- ภาวะขาดแคลนกำลังคนสะสม: ${rawMetrics.totalDeficitAcrossSites} คน
- ไซต์วิกฤตที่ต้องติดตาม: ${JSON.stringify(rawMetrics.criticalSites)}
- การแจ้งเตือนสำคัญ: ${rawMetrics.keyAlertsCount} รายการ

คำสั่ง:
เขียนสรุปเป็นภาษาไทย 1 ย่อหน้าสั้นสำหรับผู้บริหารระดับสูง เน้นสิ่งที่ต้องจัดการหรือตัดสินใจเช้านี้ พร้อมตัวเลขประกอบที่ถูกต้อง
`;

    const genResult = await provider.generate(prompt, {
      systemPrompt: SYSTEM_OPERATIONS_COPILOT_PROMPT,
      evidenceData: { getExecutiveDailyBrief: rawMetrics },
      toolsUsed: ["getExecutiveDailyBrief"],
    });

    return {
      date: rawMetrics.date,
      dataFreshness: rawMetrics.dataFreshness,
      briefText: genResult.text,
      metrics: rawMetrics,
      promptVersion: PROMPT_VERSION,
    };
  }
}
