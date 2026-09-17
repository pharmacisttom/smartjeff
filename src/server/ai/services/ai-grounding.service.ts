export interface GroundingEvidenceItem {
  metric: string;
  sourceModule: string;
  period: string;
  value: string | number | boolean;
  freshness: string;
}

export class AIGroundingService {
  /**
   * 1. Transform raw tool outputs into structured evidence items
   */
  static extractEvidenceItems(toolResults: Record<string, any>): GroundingEvidenceItem[] {
    const items: GroundingEvidenceItem[] = [];

    // Live Operations
    if (toolResults.getLiveOperations) {
      const live = toolResults.getLiveOperations;
      const freshness = live.dataFreshness || new Date().toISOString();
      const s = live.summary || {};

      items.push({
        metric: "กำลังพลปฏิบัติงานปัจจุบัน",
        sourceModule: "Live Operations Command Center",
        period: live.date || "วันนี้",
        value: s.totalEmployeesWorking ?? 0,
        freshness,
      });

      items.push({
        metric: "จำนวนไซต์งานทั้งหมด",
        sourceModule: "Live Operations Command Center",
        period: live.date || "วันนี้",
        value: s.totalSites ?? 0,
        freshness,
      });

      items.push({
        metric: "พนักงานมาสาย",
        sourceModule: "Live Operations Command Center",
        period: live.date || "วันนี้",
        value: s.lateEmployees ?? 0,
        freshness,
      });
    }

    // Workforce Forecast
    if (toolResults.getWorkforceForecast) {
      const wf = toolResults.getWorkforceForecast;
      items.push({
        metric: "ไซต์ที่ขาดแคลนกำลังคน",
        sourceModule: "Workforce Planning & Forecasting",
        period: wf.date || "คาดการณ์",
        value: wf.sitesWithDeficit ?? 0,
        freshness: wf.dataFreshness || new Date().toISOString(),
      });
    }

    // Overtime (OT)
    if (toolResults.getOTSummary) {
      const ot = toolResults.getOTSummary;
      items.push({
        metric: "ชั่วโมงทำงานล่วงเวลารวม (OT)",
        sourceModule: "Overtime & Payroll Analytics",
        period: ot.period || "งวดปัจจุบัน",
        value: `${ot.totalOtHours ?? 0} ชม.`,
        freshness: ot.dataFreshness || new Date().toISOString(),
      });
      items.push({
        metric: "ค่าล่วงเวลารวมโดยประมาณ",
        sourceModule: "Overtime & Payroll Analytics",
        period: ot.period || "งวดปัจจุบัน",
        value: `${Number(ot.totalOtAmount ?? 0).toLocaleString()} บาท`,
        freshness: ot.dataFreshness || new Date().toISOString(),
      });
    }

    // Labor Cost
    if (toolResults.getLaborCostSummary) {
      const lc = toolResults.getLaborCostSummary;
      items.push({
        metric: "ต้นทุนค่าแรงรวม",
        sourceModule: "Labor Cost Intelligence",
        period: lc.period || "งวดปัจจุบัน",
        value: `${Number(lc.totalLaborCost ?? 0).toLocaleString()} บาท`,
        freshness: lc.dataFreshness || new Date().toISOString(),
      });
    }

    // Scenario
    if (toolResults.runOperationsScenario) {
      const sc = toolResults.runOperationsScenario;
      items.push({
        metric: "กำลังพลคาดการณ์จำลอง",
        sourceModule: "Operations Scenario Simulator",
        period: sc.simulationDate || "วันจำลอง",
        value: `${sc.projected?.working ?? 0}/${sc.baseline?.target ?? 0} คน`,
        freshness: new Date().toISOString(),
      });
      items.push({
        metric: "ระดับความเสี่ยงจำลอง",
        sourceModule: "Operations Scenario Simulator",
        period: sc.simulationDate || "วันจำลอง",
        value: sc.projected?.riskLevel || "LOW",
        freshness: new Date().toISOString(),
      });
    }

    // Alerts
    if (toolResults.getOperationsAlerts) {
      const al = toolResults.getOperationsAlerts;
      items.push({
        metric: "การแจ้งเตือนปฏิบัติการ Active",
        sourceModule: "Operations Predictive Alerts",
        period: "ปัจจุบัน",
        value: al.totalAlerts ?? 0,
        freshness: al.dataFreshness || new Date().toISOString(),
      });
    }

    // Executive Brief
    if (toolResults.getExecutiveDailyBrief) {
      const b = toolResults.getExecutiveDailyBrief;
      items.push({
        metric: "การขาดแคลนกำลังพลสะสมทุกไซต์",
        sourceModule: "Executive Daily Briefing",
        period: b.date || "วันนี้",
        value: `${b.totalDeficitAcrossSites ?? 0} อัตรา`,
        freshness: b.dataFreshness || new Date().toISOString(),
      });
    }

    return items;
  }

  /**
   * 2. Build human-readable citation footnotes
   */
  static buildCitationNotes(evidenceItems: GroundingEvidenceItem[]): string {
    if (evidenceItems.length === 0) return "";
    const uniqueModules = Array.from(new Set(evidenceItems.map((e) => e.sourceModule)));
    return `\n\n---\n*ที่มาข้อมูล: ${uniqueModules.join(" · ")}*`;
  }
}
