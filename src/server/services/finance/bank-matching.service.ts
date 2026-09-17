import { prisma } from "@/lib/prisma";
import {
  CandidateTransaction,
  MatchingRulesEngine,
  MatchScoreResult,
} from "@/server/finance/banks/matching/matching-rules";

export interface BankTxWithSuggestions {
  bankTransaction: any;
  suggestions: {
    candidate: CandidateTransaction;
    match: MatchScoreResult;
  }[];
}

export class BankMatchingService {
  /**
   * Get suggestions for unmatched or suggested transactions
   */
  static async getSuggestionsForAccount(
    financialAccountId: string,
    threshold = 90
  ): Promise<BankTxWithSuggestions[]> {
    // 1. Fetch unmatched bank transactions for this account
    const bankTxs = await prisma.bankTransaction.findMany({
      where: {
        financialAccountId,
        status: { in: ["UNMATCHED", "SUGGESTED_MATCH"] },
      },
      orderBy: { transactionDate: "asc" },
      take: 50,
    });

    if (bankTxs.length === 0) return [];

    // 2. Fetch candidate unreconciled CashTransactions for this account
    const cashTxs = await prisma.cashTransaction.findMany({
      where: {
        financialAccountId,
        reconciled: false,
      },
      take: 200,
    });

    const candidates: CandidateTransaction[] = cashTxs.map((c) => ({
      id: c.id,
      targetType: "CASH_TRANSACTION",
      transactionNo: c.transactionNo,
      date: c.transactionDate,
      amount: c.amount,
      direction: c.direction as "CREDIT" | "DEBIT",
      reference: c.referenceId || undefined,
      partyName: c.partyName || undefined,
      description: c.description,
    }));

    const results: BankTxWithSuggestions[] = [];

    for (const btx of bankTxs) {
      const suggestions: { candidate: CandidateTransaction; match: MatchScoreResult }[] = [];

      for (const cand of candidates) {
        const evalResult = MatchingRulesEngine.evaluate(
          {
            id: btx.id,
            transactionDate: btx.transactionDate,
            amount: btx.amount,
            direction: btx.direction as "CREDIT" | "DEBIT",
            reference: btx.reference || undefined,
            description: btx.description,
          },
          cand,
          threshold
        );

        if (evalResult.score >= 50) {
          suggestions.push({
            candidate: cand,
            match: evalResult,
          });
        }
      }

      // Sort suggestions by score descending
      suggestions.sort((a, b) => b.match.score - a.match.score);

      // If top suggestion meets auto-suggest threshold, update status to SUGGESTED_MATCH
      if (suggestions.length > 0 && suggestions[0].match.isSuggested && btx.status === "UNMATCHED") {
        await prisma.bankTransaction.update({
          where: { id: btx.id },
          data: { status: "SUGGESTED_MATCH" },
        });
        btx.status = "SUGGESTED_MATCH";
      }

      results.push({
        bankTransaction: btx,
        suggestions,
      });
    }

    return results;
  }

  /**
   * Detect potential internal transfers between accounts
   * (Account A Debit matching Account B Credit with identical amount and within 2 days)
   */
  static async detectInternalTransfers() {
    const unreconciledDebits = await prisma.bankTransaction.findMany({
      where: {
        direction: "DEBIT",
        status: { in: ["UNMATCHED", "SUGGESTED_MATCH"] },
      },
      take: 50,
    });

    const potentialTransfers: {
      fromTx: any;
      toTx: any;
      confidence: number;
      explanation: string;
    }[] = [];

    for (const debit of unreconciledDebits) {
      const minDate = new Date(debit.transactionDate.getTime() - 2 * 86400000);
      const maxDate = new Date(debit.transactionDate.getTime() + 2 * 86400000);

      const matchingCredit = await prisma.bankTransaction.findFirst({
        where: {
          direction: "CREDIT",
          financialAccountId: { not: debit.financialAccountId },
          amount: debit.amount,
          transactionDate: { gte: minDate, lte: maxDate },
          status: { in: ["UNMATCHED", "SUGGESTED_MATCH"] },
        },
      });

      if (matchingCredit) {
        potentialTransfers.push({
          fromTx: debit,
          toTx: matchingCredit,
          confidence: 95,
          explanation: `ตรวจพบการโอนเงินระหว่างบัญชี: บัญชีต้นทางจ่ายออก ฿${debit.amount.toLocaleString()} และบัญชีปลายทางรับเข้า ฿${matchingCredit.amount.toLocaleString()} ในวันใกล้เคียงกัน`,
        });
      }
    }

    return potentialTransfers;
  }

  /**
   * Find partial match candidates for a bank transaction
   * (e.g. Bank 100,000 matches Receipt A 60,000 + Receipt B 40,000)
   */
  static async findPartialMatchCandidates(
    bankTransactionId: string
  ): Promise<{ candidates: CandidateTransaction[]; combinedTotal: number; matchesExactly: boolean }> {
    const bankTx = await prisma.bankTransaction.findUnique({
      where: { id: bankTransactionId },
    });
    if (!bankTx) throw new Error("Bank transaction not found");

    const cashTxs = await prisma.cashTransaction.findMany({
      where: {
        financialAccountId: bankTx.financialAccountId,
        direction: bankTx.direction,
        reconciled: false,
        amount: { lte: bankTx.amount },
      },
      orderBy: { amount: "desc" },
      take: 20,
    });

    const candidates: CandidateTransaction[] = cashTxs.map((c) => ({
      id: c.id,
      targetType: "CASH_TRANSACTION",
      transactionNo: c.transactionNo,
      date: c.transactionDate,
      amount: c.amount,
      direction: c.direction as "CREDIT" | "DEBIT",
      reference: c.referenceId || undefined,
      partyName: c.partyName || undefined,
      description: c.description,
    }));

    // Find combination that equals bankTx.amount (subset sum approximation)
    const selected: CandidateTransaction[] = [];
    let currentSum = 0;

    for (const cand of candidates) {
      if (currentSum + cand.amount <= bankTx.amount + 0.01) {
        selected.push(cand);
        currentSum += cand.amount;
        if (Math.abs(currentSum - bankTx.amount) < 0.01) {
          break;
        }
      }
    }

    return {
      candidates: selected,
      combinedTotal: Math.round(currentSum * 100) / 100,
      matchesExactly: Math.abs(currentSum - bankTx.amount) < 0.01,
    };
  }
}
