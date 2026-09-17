import { prisma } from "@/lib/prisma";
import { TreasuryForecastService } from "./treasury-forecast.service";

export interface LiquidityAlert {
  type:
    | "PROJECTED_NEGATIVE_CASH"
    | "LOW_CASH_BUFFER"
    | "LARGE_PAYMENT_DUE"
    | "COLLECTION_DELAY"
    | "HIGH_AR_CONCENTRATION"
    | "HIGH_AP_CONCENTRATION";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  suggestedAction: string;
  projectedDate?: string;
  amount?: number;
}

export class LiquidityRiskService {
  /**
   * Evaluate company liquidity risks and generate actionable alerts
   */
  static async evaluateLiquidityRisks(): Promise<{
    status: "HEALTHY" | "WATCH" | "CRITICAL";
    minimumBuffer: number;
    currentCash: number;
    lowestProjectedCash: number;
    alerts: LiquidityAlert[];
  }> {
    const config = await prisma.financeControlConfig.findUnique({ where: { key: "DEFAULT" } });
    const minimumBuffer = config?.minimumCashBuffer || 500000;

    const accounts = await prisma.financialAccount.findMany({ where: { status: "ACTIVE" } });
    const currentCash = accounts.reduce((s, a) => s + a.ledgerBalance, 0);

    const { minimumProjectedCash, forecastWeeks } = await TreasuryForecastService.get13WeekForecast();

    const alerts: LiquidityAlert[] = [];

    // 1. Current Buffer Check
    if (currentCash < minimumBuffer) {
      alerts.push({
        type: "LOW_CASH_BUFFER",
        severity: currentCash < minimumBuffer * 0.5 ? "CRITICAL" : "HIGH",
        title: "ยอดเงินสดต่ำกว่าเกณฑ์ขั้นต่ำ (Minimum Buffer)",
        description: `เงินสดปัจจุบันอยู่ที่ ฿${currentCash.toLocaleString()} ซึ่งต่ำกว่าเกณฑ์ความปลอดภัย ฿${minimumBuffer.toLocaleString()}`,
        suggestedAction: "เร่งติดตามลูกหนี้ค้างชำระ (AR) และชะลอรายจ่ายที่ไม่จำเป็น",
        amount: minimumBuffer - currentCash,
      });
    }

    // 2. Projected Negative Cash Check
    const negativeWeek = forecastWeeks.find((w) => w.closingCash < 0);
    if (negativeWeek) {
      alerts.push({
        type: "PROJECTED_NEGATIVE_CASH",
        severity: "CRITICAL",
        title: `คาดการณ์เงินสดติดลบในสัปดาห์ที่ ${negativeWeek.weekNumber}`,
        description: `กระแสเงินสดคาดว่าจะติดลบ ฿${Math.abs(negativeWeek.closingCash).toLocaleString()} ในช่วงวันที่ ${negativeWeek.startDate} ถึง ${negativeWeek.endDate}`,
        suggestedAction: "จัดสรรวงเงินกู้ระยะสั้นหรือเจรจาขยายระยะเวลาจ่ายเงินคู่ค้า (AP Extension)",
        projectedDate: negativeWeek.startDate,
        amount: Math.abs(negativeWeek.closingCash),
      });
    }

    // 3. Low Buffer in 13-Week Horizon
    const lowBufferWeek = forecastWeeks.find((w) => w.closingCash >= 0 && w.closingCash < minimumBuffer);
    if (lowBufferWeek && !negativeWeek) {
      alerts.push({
        type: "LOW_CASH_BUFFER",
        severity: "MEDIUM",
        title: `กระแสเงินสดจะลดต่ำกว่า Buffer ในสัปดาห์ที่ ${lowBufferWeek.weekNumber}`,
        description: `คาดว่าเงินสดคงเหลือจะลดลงเหลือ ฿${lowBufferWeek.closingCash.toLocaleString()} (ต่ำกว่าเป้าหมาย ฿${minimumBuffer.toLocaleString()})`,
        suggestedAction: "ติดตามความคืบหน้าของยอดชำระเงินตามสัญญาโครงการ",
        projectedDate: lowBufferWeek.startDate,
        amount: lowBufferWeek.closingCash,
      });
    }

    // 4. Large Outflow / Payroll Spike Alert
    const highOutflowWeek = forecastWeeks.find((w) => w.expectedOutflows.payroll > 300000);
    if (highOutflowWeek) {
      alerts.push({
        type: "LARGE_PAYMENT_DUE",
        severity: "HIGH",
        title: `ยอดจ่ายเงินเดือนรอบใหญ่ในสัปดาห์ที่ ${highOutflowWeek.weekNumber}`,
        description: `มีกำหนดจ่ายเงินเดือนเจ้าหน้าที่และพนักงานปฏิบัติการ ฿${highOutflowWeek.expectedOutflows.payroll.toLocaleString()}`,
        suggestedAction: "สำรองสภาพคล่องในบัญชีหลักก่อนกำหนดจ่ายล่วงหน้าอย่างน้อย 3 วันทำการ",
        projectedDate: highOutflowWeek.startDate,
        amount: highOutflowWeek.expectedOutflows.payroll,
      });
    }

    let overallStatus: "HEALTHY" | "WATCH" | "CRITICAL" = "HEALTHY";
    if (alerts.some((a) => a.severity === "CRITICAL")) {
      overallStatus = "CRITICAL";
    } else if (alerts.length > 0) {
      overallStatus = "WATCH";
    }

    return {
      status: overallStatus,
      minimumBuffer,
      currentCash,
      lowestProjectedCash: minimumProjectedCash,
      alerts,
    };
  }
}
