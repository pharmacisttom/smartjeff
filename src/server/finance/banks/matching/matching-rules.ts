export interface CandidateTransaction {
  id: string;
  targetType: "CASH_TRANSACTION" | "CUSTOMER_RECEIPT" | "SUPPLIER_PAYMENT" | "PAYROLL" | "EXPENSE" | "INTERNAL_TRANSFER" | "FINANCE_ADJUSTMENT";
  transactionNo: string;
  date: Date;
  amount: number;
  direction: "CREDIT" | "DEBIT"; // CREDIT = inflow, DEBIT = outflow
  reference?: string;
  partyName?: string;
  description?: string;
}

export interface BankTxCandidate {
  id: string;
  transactionDate: Date;
  amount: number;
  direction: "CREDIT" | "DEBIT";
  reference?: string;
  description: string;
}

export interface MatchScoreResult {
  score: number;
  isSuggested: boolean;
  matchMethod: "AUTO_SUGGESTED" | "MANUAL" | "REFERENCE" | "AMOUNT_DATE" | "OTHER";
  explanation: string;
  matchedAmount: number;
  factors: {
    amountScore: number;
    referenceScore: number;
    dateScore: number;
    partyScore: number;
  };
}

export class MatchingRulesEngine {
  /**
   * Evaluate match score between a bank transaction and a candidate system transaction.
   * Max score: 100 (40 amount, 35 reference, 15 date, 10 party).
   */
  static evaluate(
    bankTx: BankTxCandidate,
    candidate: CandidateTransaction,
    threshold = 90,
    dateToleranceDays = 2
  ): MatchScoreResult {
    // 1. Directions must match (both CREDIT/inflow or both DEBIT/outflow)
    if (bankTx.direction !== candidate.direction) {
      return {
        score: 0,
        isSuggested: false,
        matchMethod: "OTHER",
        explanation: "Direction mismatch (Inflow vs Outflow).",
        matchedAmount: 0,
        factors: { amountScore: 0, referenceScore: 0, dateScore: 0, partyScore: 0 },
      };
    }

    let amountScore = 0;
    let referenceScore = 0;
    let dateScore = 0;
    let partyScore = 0;
    const explanationParts: string[] = [];

    // 2. Amount Scoring (Max 40 points)
    const diff = Math.abs(bankTx.amount - candidate.amount);
    if (diff < 0.01) {
      amountScore = 40;
      explanationParts.push("ยอดเงินตรงกัน 100%");
    } else if (diff / bankTx.amount <= 0.01) {
      amountScore = 30;
      explanationParts.push(`ยอดเงินต่างกันเพียง ฿${diff.toFixed(2)} (<1%)`);
    } else {
      amountScore = 0;
    }

    // 3. Reference Scoring (Max 35 points)
    const bankRef = (bankTx.reference || "").trim().toLowerCase();
    const candRef = (candidate.reference || "").trim().toLowerCase();
    const candNo = (candidate.transactionNo || "").trim().toLowerCase();
    const bankDesc = bankTx.description.toLowerCase();

    if (
      (bankRef && candRef && bankRef === candRef) ||
      (bankRef && candNo && bankRef === candNo) ||
      (candNo && bankDesc.includes(candNo)) ||
      (candRef && bankDesc.includes(candRef))
    ) {
      referenceScore = 35;
      explanationParts.push("เลขที่อ้างอิงตรงกันชัดเจน");
    } else if (
      bankRef &&
      candRef &&
      (bankRef.includes(candRef) || candRef.includes(bankRef))
    ) {
      referenceScore = 20;
      explanationParts.push("เลขอ้างอิงมีความสอดคล้องบางส่วน");
    }

    // 4. Date Window Scoring (Max 15 points)
    const msDiff = Math.abs(bankTx.transactionDate.getTime() - candidate.date.getTime());
    const dayDiff = Math.round(msDiff / (1000 * 60 * 60 * 24));

    if (dayDiff === 0) {
      dateScore = 15;
      explanationParts.push("วันที่ตรงกันในวันเดียวกัน");
    } else if (dayDiff <= dateToleranceDays) {
      dateScore = 10;
      explanationParts.push(`วันที่ต่างกัน ${dayDiff} วัน (อยู่ในเกณฑ์ ${dateToleranceDays} วัน)`);
    } else if (dayDiff <= 5) {
      dateScore = 5;
      explanationParts.push(`วันที่ต่างกัน ${dayDiff} วัน`);
    } else {
      dateScore = 0;
    }

    // 5. Party Match Scoring (Max 10 points)
    if (candidate.partyName && candidate.partyName.trim()) {
      const party = candidate.partyName.toLowerCase().trim();
      if (bankDesc.includes(party) || (bankTx.reference && bankTx.reference.toLowerCase().includes(party))) {
        partyScore = 10;
        explanationParts.push(`พบคู่ค้า/ลูกค้า "${candidate.partyName}" ในรายการ`);
      }
    }

    const totalScore = amountScore + referenceScore + dateScore + partyScore;
    const isSuggested = totalScore >= threshold;

    let matchMethod: "AUTO_SUGGESTED" | "MANUAL" | "REFERENCE" | "AMOUNT_DATE" | "OTHER" = "OTHER";
    if (isSuggested) {
      matchMethod = "AUTO_SUGGESTED";
    } else if (referenceScore >= 35) {
      matchMethod = "REFERENCE";
    } else if (amountScore === 40 && dateScore >= 10) {
      matchMethod = "AMOUNT_DATE";
    }

    const explanation =
      explanationParts.length > 0
        ? explanationParts.join(", ")
        : "ไม่พบความสอดคล้องของข้อมูล";

    return {
      score: totalScore,
      isSuggested,
      matchMethod,
      explanation,
      matchedAmount: Math.min(bankTx.amount, candidate.amount),
      factors: { amountScore, referenceScore, dateScore, partyScore },
    };
  }
}
