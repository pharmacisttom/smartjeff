import { prisma } from "@/lib/prisma";
import { AuditService } from "../audit.service";

export interface ConfirmMatchInput {
  bankTransactionId: string;
  targetType: "CASH_TRANSACTION" | "CUSTOMER_RECEIPT" | "SUPPLIER_PAYMENT" | "PAYROLL" | "EXPENSE" | "INTERNAL_TRANSFER" | "FINANCE_ADJUSTMENT";
  targetId: string;
  matchedAmount: number;
  matchMethod: "AUTO_SUGGESTED" | "MANUAL" | "REFERENCE" | "AMOUNT_DATE" | "OTHER";
  matchScore: number;
  matchExplanation?: string;
  confirmedBy: string;
}

export class BankReconciliationService {
  /**
   * Confirm match (Human confirmation)
   */
  static async confirmMatch(input: ConfirmMatchInput) {
    const bankTx = await prisma.bankTransaction.findUnique({
      where: { id: input.bankTransactionId },
    });
    if (!bankTx) throw new Error("Bank transaction not found");

    if (bankTx.status === "MATCHED") {
      throw new Error("Bank transaction is already fully matched");
    }

    // Create match record
    const match = await prisma.bankReconciliationMatch.create({
      data: {
        bankTransactionId: input.bankTransactionId,
        targetType: input.targetType,
        targetId: input.targetId,
        matchedAmount: input.matchedAmount,
        matchMethod: input.matchMethod,
        matchScore: input.matchScore,
        matchExplanation: input.matchExplanation,
        confirmedBy: input.confirmedBy,
        status: "CONFIRMED",
      },
    });

    // Check if fully or partially matched
    const allMatches = await prisma.bankReconciliationMatch.findMany({
      where: {
        bankTransactionId: input.bankTransactionId,
        status: "CONFIRMED",
      },
    });

    const totalMatchedAmount = allMatches.reduce((sum, m) => sum + m.matchedAmount, 0);
    const newStatus = totalMatchedAmount >= bankTx.amount - 0.01 ? "MATCHED" : "PARTIALLY_MATCHED";

    await prisma.bankTransaction.update({
      where: { id: input.bankTransactionId },
      data: { status: newStatus },
    });

    // If target is CASH_TRANSACTION, mark it reconciled
    if (input.targetType === "CASH_TRANSACTION") {
      await prisma.cashTransaction.update({
        where: { id: input.targetId },
        data: {
          reconciled: true,
          reconciledAt: new Date(),
          reconciledMatchId: match.id,
        },
      });
    }

    // Update Account reconciled balance
    await this.refreshAccountReconciledBalance(bankTx.financialAccountId);

    await AuditService.log({
      userId: input.confirmedBy,
      action: "BANK_RECONCILIATION_MATCH_CONFIRMED",
      entity: "BankReconciliationMatch",
      entityId: match.id,
      metadata: {
        bankTransactionId: input.bankTransactionId,
        targetType: input.targetType,
        targetId: input.targetId,
        amount: input.matchedAmount,
        score: input.matchScore,
      },
    });

    return match;
  }

  /**
   * Unmatch a previously confirmed match
   */
  static async unmatch(matchId: string, unmatchReason: string, userId: string) {
    const match = await prisma.bankReconciliationMatch.findUnique({
      where: { id: matchId },
    });
    if (!match) throw new Error("Match not found");

    await prisma.bankReconciliationMatch.update({
      where: { id: matchId },
      data: {
        status: "UNMATCHED",
        unmatchReason,
      },
    });

    // Revert CashTransaction if needed
    if (match.targetType === "CASH_TRANSACTION") {
      await prisma.cashTransaction.update({
        where: { id: match.targetId },
        data: {
          reconciled: false,
          reconciledAt: null,
          reconciledMatchId: null,
        },
      });
    }

    // Check remaining active matches for bank transaction
    const remainingMatches = await prisma.bankReconciliationMatch.findMany({
      where: {
        bankTransactionId: match.bankTransactionId,
        status: "CONFIRMED",
      },
    });

    const bankTx = await prisma.bankTransaction.findUnique({
      where: { id: match.bankTransactionId },
    });

    if (bankTx) {
      const remainingTotal = remainingMatches.reduce((s, m) => s + m.matchedAmount, 0);
      let nextStatus = "UNMATCHED";
      if (remainingMatches.length > 0) {
        nextStatus = remainingTotal >= bankTx.amount - 0.01 ? "MATCHED" : "PARTIALLY_MATCHED";
      }

      await prisma.bankTransaction.update({
        where: { id: bankTx.id },
        data: { status: nextStatus },
      });

      await this.refreshAccountReconciledBalance(bankTx.financialAccountId);
    }

    await AuditService.log({
      userId,
      action: "BANK_RECONCILIATION_UNMATCHED",
      entity: "BankReconciliationMatch",
      entityId: matchId,
      metadata: { unmatchReason },
    });

    return { success: true };
  }

  /**
   * Categorize an unmatched transaction in review queue
   */
  static async categorizeUnmatched(
    bankTransactionId: string,
    category: "UNKNOWN_RECEIPT" | "UNKNOWN_PAYMENT" | "BANK_FEE" | "INTEREST" | "TRANSFER" | "REFUND" | "OTHER",
    userId: string
  ) {
    const tx = await prisma.bankTransaction.findUnique({
      where: { id: bankTransactionId },
    });
    if (!tx) throw new Error("Bank transaction not found");

    const updated = await prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: {
        unmatchedCategory: category,
        status: "REVIEW_REQUIRED",
      },
    });

    await AuditService.log({
      userId,
      action: "BANK_TRANSACTION_CATEGORIZED",
      entity: "BankTransaction",
      entityId: bankTransactionId,
      metadata: { category },
    });

    return updated;
  }

  /**
   * Create Adjustment / CashTransaction for Bank Fee or Interest income, then auto-reconcile
   */
  static async createAdjustmentForFeeOrInterest(
    bankTransactionId: string,
    confirmedBy: string,
    notes?: string
  ) {
    const bankTx = await prisma.bankTransaction.findUnique({
      where: { id: bankTransactionId },
    });
    if (!bankTx) throw new Error("Bank transaction not found");

    const count = await prisma.cashTransaction.count();
    const isFee = bankTx.direction === "DEBIT";
    const prefix = isFee ? "FEE" : "INT";
    const transactionNo = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    const cashTx = await prisma.cashTransaction.create({
      data: {
        transactionNo,
        financialAccountId: bankTx.financialAccountId,
        transactionDate: bankTx.transactionDate,
        amount: bankTx.amount,
        direction: bankTx.direction,
        category: isFee ? "FEE" : "INTEREST",
        referenceType: "FINANCE_ADJUSTMENT",
        referenceId: bankTx.reference || transactionNo,
        description: notes || bankTx.description,
        partyType: "INTERNAL",
        partyName: isFee ? "Bank Charge" : "Bank Interest",
        reconciled: true,
        reconciledAt: new Date(),
      },
    });

    // Update account ledger balance
    const account = await prisma.financialAccount.findUnique({
      where: { id: bankTx.financialAccountId },
    });
    if (account) {
      const delta = isFee ? -bankTx.amount : bankTx.amount;
      await prisma.financialAccount.update({
        where: { id: account.id },
        data: { ledgerBalance: Math.round((account.ledgerBalance + delta) * 100) / 100 },
      });
    }

    // Confirm match
    const match = await this.confirmMatch({
      bankTransactionId: bankTx.id,
      targetType: "CASH_TRANSACTION",
      targetId: cashTx.id,
      matchedAmount: bankTx.amount,
      matchMethod: "MANUAL",
      matchScore: 100,
      matchExplanation: isFee ? "บันทึกค่าธรรมเนียมธนาคารอัตโนมัติ" : "บันทึกรายได้ดอกเบี้ยธนาคารอัตโนมัติ",
      confirmedBy,
    });

    return { cashTx, match };
  }

  /**
   * Exclude a bank transaction with mandatory reason
   */
  static async excludeTransaction(bankTransactionId: string, reason: string, userId: string) {
    if (!reason || !reason.trim()) {
      throw new Error("Exclusion reason is required.");
    }

    const tx = await prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: {
        status: "EXCLUDED",
        exclusionReason: reason.trim(),
        excludedBy: userId,
        excludedAt: new Date(),
      },
    });

    await AuditService.log({
      userId,
      action: "BANK_TRANSACTION_EXCLUDED",
      entity: "BankTransaction",
      entityId: bankTransactionId,
      metadata: { reason },
    });

    return tx;
  }

  /**
   * Close & Lock reconciliation period
   * Requires that importer cannot be final approver if separationOfDuties is active
   */
  static async closeReconciliationPeriod(
    statementId: string,
    lockedBy: string,
    overrideDiscrepancy = false
  ) {
    const statement = await prisma.bankStatement.findUnique({
      where: { id: statementId },
    });
    if (!statement) throw new Error("Statement not found");

    if (statement.status === "LOCKED") {
      throw new Error("Statement is already locked.");
    }

    // Separation of duties check
    const config = await prisma.financeControlConfig.findUnique({ where: { key: "DEFAULT" } });
    if (config?.separationOfDutiesEnabled && statement.importedBy === lockedBy) {
      throw new Error("Separation of Duties violation: Statement importer cannot be the final reconciliation approver.");
    }

    const account = await prisma.financialAccount.findUnique({
      where: { id: statement.financialAccountId },
    });
    if (!account) throw new Error("Account not found");

    // Check unmatched transactions in period
    const unmatchedCount = await prisma.bankTransaction.count({
      where: {
        statementId,
        status: { in: ["UNMATCHED", "REVIEW_REQUIRED", "SUGGESTED_MATCH"] },
      },
    });

    const difference = Math.abs(account.ledgerBalance - statement.closingBalance);

    if (difference > 0.01 && !overrideDiscrepancy) {
      throw new Error(
        `Cannot close reconciliation: Ledger balance (฿${account.ledgerBalance.toLocaleString()}) and Statement closing balance (฿${statement.closingBalance.toLocaleString()}) have a difference of ฿${difference.toFixed(2)}. Unmatched transactions: ${unmatchedCount}.`
      );
    }

    const locked = await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        status: "LOCKED",
        lockedAt: new Date(),
        lockedBy,
      },
    });

    await prisma.financialAccount.update({
      where: { id: statement.financialAccountId },
      data: {
        lastReconciledDate: statement.periodEnd,
        reconciledBalance: statement.closingBalance,
      },
    });

    await AuditService.log({
      userId: lockedBy,
      action: "BANK_RECONCILIATION_PERIOD_LOCKED",
      entity: "BankStatement",
      entityId: statementId,
      metadata: {
        statementNo: statement.statementNo,
        closingBalance: statement.closingBalance,
        ledgerBalance: account.ledgerBalance,
        difference,
      },
    });

    return locked;
  }

  /**
   * Refresh account reconciled balance from matched bank transactions
   */
  static async refreshAccountReconciledBalance(accountId: string) {
    const account = await prisma.financialAccount.findUnique({ where: { id: accountId } });
    if (!account) return;

    // Sum all matched credit vs debit for this account
    const matchedCredits = await prisma.bankTransaction.aggregate({
      where: { financialAccountId: accountId, status: "MATCHED", direction: "CREDIT" },
      _sum: { amount: true },
    });
    const matchedDebits = await prisma.bankTransaction.aggregate({
      where: { financialAccountId: accountId, status: "MATCHED", direction: "DEBIT" },
      _sum: { amount: true },
    });

    const credits = matchedCredits._sum.amount || 0;
    const debits = matchedDebits._sum.amount || 0;
    const reconciled = Math.round((credits - debits) * 100) / 100;

    await prisma.financialAccount.update({
      where: { id: accountId },
      data: { reconciledBalance: reconciled },
    });
  }

  /**
   * Get reconciliation dashboard KPI summary
   */
  static async getReconciliationSummary(accountId?: string) {
    const accountFilter = accountId ? { financialAccountId: accountId } : {};

    const totalTxCount = await prisma.bankTransaction.count({ where: accountFilter });
    const matchedCount = await prisma.bankTransaction.count({
      where: { ...accountFilter, status: "MATCHED" },
    });
    const suggestedCount = await prisma.bankTransaction.count({
      where: { ...accountFilter, status: "SUGGESTED_MATCH" },
    });
    const unmatchedCount = await prisma.bankTransaction.count({
      where: { ...accountFilter, status: "UNMATCHED" },
    });
    const reviewRequiredCount = await prisma.bankTransaction.count({
      where: { ...accountFilter, status: "REVIEW_REQUIRED" },
    });
    const excludedCount = await prisma.bankTransaction.count({
      where: { ...accountFilter, status: "EXCLUDED" },
    });

    const accounts = await prisma.financialAccount.findMany({
      where: accountId ? { id: accountId } : {},
    });

    const totalLedgerBalance = accounts.reduce((s, a) => s + a.ledgerBalance, 0);
    const totalBankBalance = accounts.reduce((s, a) => s + a.lastBankBalance, 0);
    const totalReconciledBalance = accounts.reduce((s, a) => s + a.reconciledBalance, 0);
    const totalDifference = Math.round(Math.abs(totalLedgerBalance - totalBankBalance) * 100) / 100;

    return {
      kpi: {
        totalBankTransactions: totalTxCount,
        matched: matchedCount,
        suggested: suggestedCount,
        unmatched: unmatchedCount,
        reviewRequired: reviewRequiredCount,
        excluded: excludedCount,
        matchedPercentage: totalTxCount > 0 ? Math.round((matchedCount / totalTxCount) * 100) : 0,
      },
      balances: {
        ledgerBalance: totalLedgerBalance,
        bankBalance: totalBankBalance,
        reconciledBalance: totalReconciledBalance,
        difference: totalDifference,
      },
      accounts: accounts.map((a) => ({
        id: a.id,
        accountCode: a.accountCode,
        accountName: a.accountName,
        bankCode: a.bankCode,
        maskedAccountNo: a.maskedAccountNo,
        ledgerBalance: a.ledgerBalance,
        lastBankBalance: a.lastBankBalance,
        reconciledBalance: a.reconciledBalance,
        difference: Math.round(Math.abs(a.ledgerBalance - a.lastBankBalance) * 100) / 100,
        lastReconciledDate: a.lastReconciledDate,
      })),
    };
  }
}
