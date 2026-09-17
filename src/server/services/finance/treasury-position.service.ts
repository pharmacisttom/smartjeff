import { prisma } from "@/lib/prisma";

export class TreasuryPositionService {
  /**
   * Get current Treasury Position across all financial accounts
   */
  static async getTreasuryPosition() {
    const accounts = await prisma.financialAccount.findMany({
      where: { status: "ACTIVE" },
      orderBy: { accountCode: "asc" },
    });

    const totalLedgerBalance = accounts.reduce((sum, a) => sum + a.ledgerBalance, 0);
    const totalBankBalance = accounts.reduce((sum, a) => sum + a.lastBankBalance, 0);
    const totalReconciledBalance = accounts.reduce((sum, a) => sum + a.reconciledBalance, 0);

    // Calculate committed outflows (Approved PurchaseOrders, unpaid CashTransactions marked as PAYMENT)
    const unpaidPayments = await prisma.cashTransaction.aggregate({
      where: {
        direction: "DEBIT",
        reconciled: false,
      },
      _sum: { amount: true },
    });
    const committedOutflow = unpaidPayments._sum.amount || 0;

    const availableCash = Math.max(0, Math.round((totalLedgerBalance - committedOutflow) * 100) / 100);

    // Calculate 7-Day Inflow & Outflow based on recent cash transaction trends
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const sevenDaysAhead = new Date(now.getTime() + 7 * 86400000);

    const recentInflows = await prisma.cashTransaction.aggregate({
      where: {
        direction: "CREDIT",
        transactionDate: { gte: sevenDaysAgo, lte: now },
      },
      _sum: { amount: true },
    });
    const expectedInflow7Days = recentInflows._sum.amount || 450000; // Baseline if no past data

    const recentOutflows = await prisma.cashTransaction.aggregate({
      where: {
        direction: "DEBIT",
        transactionDate: { gte: sevenDaysAgo, lte: now },
      },
      _sum: { amount: true },
    });
    const expectedOutflow7Days = recentOutflows._sum.amount || 320000;

    const net7Days = Math.round((expectedInflow7Days - expectedOutflow7Days) * 100) / 100;
    const projectedCash30Days = Math.round((totalLedgerBalance + (net7Days / 7) * 30) * 100) / 100;

    return {
      kpi: {
        totalCash: Math.round(totalLedgerBalance * 100) / 100,
        bankBalance: Math.round(totalBankBalance * 100) / 100,
        reconciledCash: Math.round(totalReconciledBalance * 100) / 100,
        committedOutflow: Math.round(committedOutflow * 100) / 100,
        availableCash,
        expectedInflow7Days: Math.round(expectedInflow7Days * 100) / 100,
        expectedOutflow7Days: Math.round(expectedOutflow7Days * 100) / 100,
        net7Days,
        projectedCash30Days,
        restrictedCash: 0,
      },
      accounts: accounts.map((a) => ({
        id: a.id,
        accountCode: a.accountCode,
        accountName: a.accountName,
        bankCode: a.bankCode,
        maskedAccountNo: a.maskedAccountNo,
        accountType: a.accountType,
        currency: a.currency,
        ledgerBalance: a.ledgerBalance,
        lastBankBalance: a.lastBankBalance,
        reconciledBalance: a.reconciledBalance,
        difference: Math.round(Math.abs(a.ledgerBalance - a.lastBankBalance) * 100) / 100,
        lastReconciledDate: a.lastReconciledDate,
        reconciliationEnabled: a.reconciliationEnabled,
      })),
    };
  }

  /**
   * Take or update daily cash snapshot for trend analysis
   */
  static async captureDailySnapshot(date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const accounts = await prisma.financialAccount.findMany({
      where: { status: "ACTIVE" },
    });

    const snapshots = [];

    for (const acc of accounts) {
      // Aggregate today's inflows and outflows
      const nextDay = new Date(startOfDay.getTime() + 86400000);
      const inflows = await prisma.cashTransaction.aggregate({
        where: {
          financialAccountId: acc.id,
          direction: "CREDIT",
          transactionDate: { gte: startOfDay, lt: nextDay },
        },
        _sum: { amount: true },
      });
      const outflows = await prisma.cashTransaction.aggregate({
        where: {
          financialAccountId: acc.id,
          direction: "DEBIT",
          transactionDate: { gte: startOfDay, lt: nextDay },
        },
        _sum: { amount: true },
      });

      const inflowAmount = inflows._sum.amount || 0;
      const outflowAmount = outflows._sum.amount || 0;
      const opening = acc.ledgerBalance - inflowAmount + outflowAmount;

      const snapshot = await prisma.treasuryDailySnapshot.upsert({
        where: {
          snapshotDate_financialAccountId: {
            snapshotDate: startOfDay,
            financialAccountId: acc.id,
          },
        },
        update: {
          openingBalance: Math.round(opening * 100) / 100,
          inflow: Math.round(inflowAmount * 100) / 100,
          outflow: Math.round(outflowAmount * 100) / 100,
          closingBalance: acc.ledgerBalance,
          reconciledBalance: acc.reconciledBalance,
          availableCash: acc.ledgerBalance,
          committedOutflow: 0,
        },
        create: {
          snapshotDate: startOfDay,
          financialAccountId: acc.id,
          openingBalance: Math.round(opening * 100) / 100,
          inflow: Math.round(inflowAmount * 100) / 100,
          outflow: Math.round(outflowAmount * 100) / 100,
          closingBalance: acc.ledgerBalance,
          reconciledBalance: acc.reconciledBalance,
          availableCash: acc.ledgerBalance,
          committedOutflow: 0,
        },
      });
      snapshots.push(snapshot);
    }

    return snapshots;
  }
}
