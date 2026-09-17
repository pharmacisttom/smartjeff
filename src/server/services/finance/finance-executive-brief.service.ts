import { prisma } from "@/lib/prisma";
import { TreasuryPositionService } from "./treasury-position.service";
import { LiquidityRiskService } from "./liquidity-risk.service";
import { BankReconciliationService } from "./bank-reconciliation.service";

export interface WhatChangedAlert {
  category: "TREASURY" | "RECONCILIATION" | "BUDGET" | "RISK";
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  detail: string;
}

export class FinanceExecutiveBriefService {
  /**
   * Generate executive daily financial brief with structured real-time data
   */
  static async generateDailyBrief(): Promise<{
    headlineText: string;
    summaryMetrics: {
      cashLedger: number;
      reconciledCash: number;
      availableCash: number;
      reconciledAccountsCount: number;
      totalAccountsCount: number;
      inflow7Days: number;
      outflow7Days: number;
      net7Days: number;
      liquidityStatus: string;
    };
    whatChanged: WhatChangedAlert[];
  }> {
    const position = await TreasuryPositionService.getTreasuryPosition();
    const reconciliation = await BankReconciliationService.getReconciliationSummary();
    const liquidity = await LiquidityRiskService.evaluateLiquidityRisks();

    const totalAccounts = position.accounts.length;
    const reconciledAccounts = position.accounts.filter(
      (a) => a.difference === 0 && a.lastReconciledDate
    ).length;

    const cashLedgerStr = `฿${position.kpi.totalCash.toLocaleString()}`;
    const inflow7Str = `฿${position.kpi.expectedInflow7Days.toLocaleString()}`;
    const outflow7Str = `฿${position.kpi.expectedOutflow7Days.toLocaleString()}`;

    const headlineText = `วันนี้ยอดเงินตาม Cash Ledger เท่ากับ ${cashLedgerStr} บาท โดยบัญชีที่กระทบยอดล่าสุดครบ ${reconciledAccounts} จาก ${totalAccounts} บัญชี ภายใน 7 วันคาดว่าจะมีเงินเข้า ${inflow7Str} บาท และเงินออก ${outflow7Str} บาท สถานะสภาพคล่องรวมอยู่ในระดับ: ${liquidity.status}`;

    // What changed detection
    const whatChanged: WhatChangedAlert[] = [];

    if (reconciliation.kpi.unmatched > 0) {
      whatChanged.push({
        category: "RECONCILIATION",
        severity: reconciliation.kpi.unmatched > 5 ? "WARNING" : "INFO",
        title: "พบรายการเดินบัญชีรอการกระทบยอด",
        detail: `มีรายการธนาคารค้างกระทบยอด ${reconciliation.kpi.unmatched} รายการ และมี ${reconciliation.kpi.suggested} รายการที่ระบบจับคู่แนะนำแล้ว`,
      });
    }

    if (reconciliation.balances.difference > 0) {
      whatChanged.push({
        category: "RECONCILIATION",
        severity: "WARNING",
        title: "ผลต่างระหว่างระบบและธนาคาร (Reconciliation Difference)",
        detail: `ยอดตามระบบต่างจากธนาคารรวม ฿${reconciliation.balances.difference.toLocaleString()} บาท กรุณาตรวจสอบและกระทบยอด`,
      });
    }

    for (const alert of liquidity.alerts) {
      whatChanged.push({
        category: "RISK",
        severity: alert.severity === "CRITICAL" ? "CRITICAL" : "WARNING",
        title: alert.title,
        detail: alert.description,
      });
    }

    // Budget over-spend checks
    const overBudgetLines = await prisma.budgetLine.findMany({
      where: { availableAmount: { lt: 0 } },
      take: 5,
    });
    if (overBudgetLines.length > 0) {
      whatChanged.push({
        category: "BUDGET",
        severity: "CRITICAL",
        title: `พบหมวดงบประมาณเกินกรอบ ${overBudgetLines.length} หมวด`,
        detail: `หมวด ${overBudgetLines.map((l) => l.category).join(", ")} มียอดใช้จ่ายและ Commitment รวมเกินงบประมาณที่จัดสรร`,
      });
    }

    return {
      headlineText,
      summaryMetrics: {
        cashLedger: position.kpi.totalCash,
        reconciledCash: position.kpi.reconciledCash,
        availableCash: position.kpi.availableCash,
        reconciledAccountsCount: reconciledAccounts,
        totalAccountsCount: totalAccounts,
        inflow7Days: position.kpi.expectedInflow7Days,
        outflow7Days: position.kpi.expectedOutflow7Days,
        net7Days: position.kpi.net7Days,
        liquidityStatus: liquidity.status,
      },
      whatChanged,
    };
  }
}
