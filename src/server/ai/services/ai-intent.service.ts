export type OperationIntentType =
  | "LIVE_OPERATIONS"
  | "WORKFORCE"
  | "FORECAST"
  | "ATTENDANCE"
  | "OT"
  | "PAYROLL_SUMMARY"
  | "LABOR_COST"
  | "ALERTS"
  | "SITE_COMPARISON"
  | "SCENARIO"
  | "EXECUTIVE_BRIEF"
  | "INVENTORY"
  | "PROCUREMENT"
  | "ASSET"
  | "GENERAL_HELP";

export interface ResolvedIntent {
  intent: OperationIntentType;
  confidence: number;
  tools: Array<{
    toolName: string;
    input: Record<string, any>;
  }>;
  entities: {
    siteId?: string;
    siteIdB?: string;
    date?: string;
    period?: string;
    deficitDelta?: number;
    surplusDelta?: number;
    metric?: string;
  };
}

export class AIIntentService {
  /**
   * Classify intent and extract entities from Thai / English operational queries
   */
  static resolveIntent(question: string, context?: { currentSiteId?: string; defaultDate?: string }): ResolvedIntent {
    const q = question.trim().toLowerCase();

    // 1. Entity Extraction
    const entities: ResolvedIntent["entities"] = {};
    if (context?.currentSiteId) {
      entities.siteId = context.currentSiteId;
    }

    // Extract Date / Time Range
    const today = new Date();
    const tomorrow = new Date(Date.now() + 86400000);
    const yesterday = new Date(Date.now() - 86400000);

    const toIsoDate = (d: Date) => d.toISOString().split("T")[0];
    const toIsoMonth = (d: Date) => d.toISOString().slice(0, 7);

    if (q.includes("พรุ่งนี้") || q.includes("tomorrow")) {
      entities.date = toIsoDate(tomorrow);
    } else if (q.includes("เมื่อวาน") || q.includes("yesterday")) {
      entities.date = toIsoDate(yesterday);
    } else if (q.includes("วันนี้") || q.includes("today")) {
      entities.date = toIsoDate(today);
    } else if (context?.defaultDate) {
      entities.date = context.defaultDate;
    }

    if (q.includes("เดือนก่อน") || q.includes("เดือนที่แล้ว") || q.includes("last month")) {
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      entities.period = toIsoMonth(lastMonth);
    } else if (q.includes("เดือนนี้") || q.includes("this month")) {
      entities.period = toIsoMonth(today);
    }

    // Extract Scenario Deltas (e.g. "ขาด 5 คน", "ขาดอีก 3 คน", "ขาดพนักงาน 5 คน")
    const shortageMatch = q.match(/ขาด(?:อีก|พนักงาน)?\s*(\d+)\s*คน/);
    if (shortageMatch) {
      entities.deficitDelta = parseInt(shortageMatch[1], 10);
    }

    // Extract Site Names or Codes from string (e.g. "site a", "site b", "ไซต์ a", "ไซต์ระยอง")
    const siteMatch = question.match(/(?:site|ไซต์|สาขา)\s*([a-zA-Z0-9ก-๙]+)/i);
    if (siteMatch && !entities.siteId) {
      entities.siteId = siteMatch[1].toUpperCase();
    }

    // Compare match (e.g. "เปรียบเทียบ site a กับ site b", "compare site 1 and site 2")
    const compareMatch = question.match(/(?:เปรียบเทียบ|เทียบ|compare)\s*(?:site|ไซต์)?\s*([a-zA-Z0-9ก-๙]+)\s*(?:กับ|และ|and|with)\s*(?:site|ไซต์)?\s*([a-zA-Z0-9ก-๙]+)/i);
    if (compareMatch) {
      entities.siteId = compareMatch[1].toUpperCase();
      entities.siteIdB = compareMatch[2].toUpperCase();
    }

    // 2. Intent Classification
    // Scenario / Simulation
    if (
      q.includes("ถ้า") ||
      q.includes("จำลอง") ||
      q.includes("scenario") ||
      q.includes("สมมติ") ||
      entities.deficitDelta !== undefined
    ) {
      return {
        intent: "SCENARIO",
        confidence: 0.95,
        tools: [
          {
            toolName: "runOperationsScenario",
            input: {
              siteId: entities.siteId || "DEFAULT",
              deficitDelta: entities.deficitDelta || 3,
              date: entities.date,
            },
          },
        ],
        entities,
      };
    }

    // Site Comparison
    if (
      q.includes("เปรียบเทียบ") ||
      q.includes("เทียบ") ||
      q.includes("compare") ||
      entities.siteIdB !== undefined
    ) {
      return {
        intent: "SITE_COMPARISON",
        confidence: 0.92,
        tools: [
          {
            toolName: "compareSites",
            input: {
              siteIdA: entities.siteId || "SITE-A",
              siteIdB: entities.siteIdB || "SITE-B",
              period: entities.period,
            },
          },
        ],
        entities,
      };
    }

    // Executive Daily Brief / Morning summary
    if (
      q.includes("สรุปเช้านี้") ||
      q.includes("สรุปภาพรวม") ||
      q.includes("daily brief") ||
      q.includes("สิ่งที่ต้องจัดการ") ||
      q.includes("สรุปเรื่องที่ผู้บริหารต้องจัดการ") ||
      q.includes("brief")
    ) {
      return {
        intent: "EXECUTIVE_BRIEF",
        confidence: 0.94,
        tools: [
          {
            toolName: "getExecutiveDailyBrief",
            input: { date: entities.date },
          },
          {
            toolName: "getOperationsAlerts",
            input: { severity: "HIGH" },
          },
        ],
        entities,
      };
    }

    // Alerts
    if (
      q.includes("alert") ||
      q.includes("เตือน") ||
      q.includes("การแจ้งเตือน") ||
      q.includes("ความผิดปกติ")
    ) {
      return {
        intent: "ALERTS",
        confidence: 0.9,
        tools: [
          {
            toolName: "getOperationsAlerts",
            input: { siteId: entities.siteId },
          },
        ],
        entities,
      };
    }

    // Overtime (OT)
    if (
      q.includes("ot") ||
      q.includes("โอที") ||
      q.includes("ล่วงเวลา") ||
      q.includes("ทำไม ot")
    ) {
      return {
        intent: "OT",
        confidence: 0.92,
        tools: [
          {
            toolName: "getOTSummary",
            input: { period: entities.period, siteId: entities.siteId },
          },
          {
            toolName: "getLiveOperations",
            input: {},
          },
        ],
        entities,
      };
    }

    // Labor Cost & Payroll
    if (
      q.includes("ค่าแรง") ||
      q.includes("เงินเดือน") ||
      q.includes("ต้นทุน") ||
      q.includes("labor cost") ||
      q.includes("payroll")
    ) {
      return {
        intent: "LABOR_COST",
        confidence: 0.9,
        tools: [
          {
            toolName: "getLaborCostSummary",
            input: { period: entities.period, siteId: entities.siteId },
          },
          {
            toolName: "getOTSummary",
            input: { period: entities.period, siteId: entities.siteId },
          },
        ],
        entities,
      };
    }

    // Attendance Exceptions / Geofence / Late
    if (
      q.includes("exception") ||
      q.includes("สาย") ||
      q.includes("geofence") ||
      q.includes("ลงเวลานอก") ||
      q.includes("ตรวจ") ||
      q.includes("การลงเวลา")
    ) {
      return {
        intent: "ATTENDANCE",
        confidence: 0.88,
        tools: [
          {
            toolName: "getAttendanceExceptions",
            input: { date: entities.date, siteId: entities.siteId },
          },
          {
            toolName: "getAttendanceSummary",
            input: { date: entities.date, siteId: entities.siteId },
          },
        ],
        entities,
      };
    }

    // Workforce Forecast & Shortage
    if (
      q.includes("ขาดคน") ||
      q.includes("คนไม่ครบ") ||
      q.includes("กำลังคน") ||
      q.includes("คาดการณ์") ||
      q.includes("forecast") ||
      q.includes("พรุ่งนี้") ||
      q.includes("ความเสี่ยง")
    ) {
      return {
        intent: "FORECAST",
        confidence: 0.91,
        tools: [
          {
            toolName: "getWorkforceForecast",
            input: { date: entities.date, siteId: entities.siteId },
          },
          {
            toolName: "getSiteRisk",
            input: { siteId: entities.siteId },
          },
        ],
        entities,
      };
    }

    // Live Operations (default for current status questions)
    if (
      q.includes("ทำงานอยู่กี่คน") ||
      q.includes("ตอนนี้") ||
      q.includes("สถานการณ์") ||
      q.includes("กี่คน") ||
      q.includes("เปิดกี่ไซต์") ||
      q.includes("live") ||
      q.includes("ติดตาม")
    ) {
      return {
        intent: "LIVE_OPERATIONS",
        confidence: 0.9,
        tools: [
          {
            toolName: "getLiveOperations",
            input: {},
          },
        ],
        entities,
      };
    }

    // Phase 16: Inventory & Low Stock
    if (
      q.includes("ของ") ||
      q.includes("สต็อก") ||
      q.includes("สต๊อก") ||
      q.includes("คลัง") ||
      q.includes("ใกล้หมด") ||
      q.includes("หมดคลัง") ||
      q.includes("inventory") ||
      q.includes("low stock")
    ) {
      return {
        intent: "INVENTORY",
        confidence: 0.92,
        tools: [
          { toolName: "getLowStockItems", input: {} },
          { toolName: "getInventorySummary", input: {} },
        ],
        entities,
      };
    }

    // Phase 16: Procurement & PO & PR
    if (
      q.includes("จัดซื้อ") ||
      q.includes("สั่งซื้อ") ||
      q.includes("po") ||
      q.includes("pr") ||
      q.includes("ขอซื้อ") ||
      q.includes("supplier") ||
      q.includes("ผู้จำหน่าย") ||
      q.includes("ส่งของ") ||
      q.includes("ส่งช้า")
    ) {
      return {
        intent: "PROCUREMENT",
        confidence: 0.9,
        tools: [
          { toolName: "getPurchaseOrderSummary", input: {} },
          { toolName: "getSupplierDeliverySummary", input: {} },
          { toolName: "getPurchaseRequestSummary", input: {} },
        ],
        entities,
      };
    }

    // Phase 16: Assets & Tools
    if (
      q.includes("เครื่องมือ") ||
      q.includes("อุปกรณ์") ||
      q.includes("asset") ||
      q.includes("ทรัพย์สิน") ||
      q.includes("ยืม") ||
      q.includes("คืน")
    ) {
      return {
        intent: "ASSET",
        confidence: 0.88,
        tools: [
          { toolName: "getAssetSummary", input: { siteId: entities.siteId } },
        ],
        entities,
      };
    }

    // General / Fallback
    return {
      intent: "LIVE_OPERATIONS",
      confidence: 0.7,
      tools: [
        {
          toolName: "getLiveOperations",
          input: {},
        },
      ],
      entities,
    };
  }
}
