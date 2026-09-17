import { prisma } from "@/lib/prisma";

export interface BankReconciliationMatch {
  ledgerEntryId: string;
  bankRefNo: string | null;
  ledgerAmount: number;
  ledgerDate: string;
  matchedInvoiceId: string | null;
  invoiceRefNo: string | null;
  clientName: string | null;
  confidenceScore: number; // 0 to 100
  matchStatus: "EXACT_MATCH" | "PROBABLE_MATCH" | "REVIEW_REQUIRED";
  explanation: string;
  matchingCriteria: {
    amountMatch: boolean;
    referenceMatch: boolean;
    dateDifferenceDays: number;
    clientMatch: boolean;
  };
}

export class FinanceIntelligenceService {
  /**
   * Performs explainable bank reconciliation matching between cash ledger entries and outstanding invoices.
   */
  static async reconcileBankTransactions(): Promise<BankReconciliationMatch[]> {
    const entries = await prisma.cashLedgerEntry.findMany({
      where: { isReconciled: false, direction: "INFLOW" },
      orderBy: { entryDate: "desc" },
      take: 50,
    });

    const openInvoices = await prisma.invoice.findMany({
      where: { status: { in: ["ISSUED", "PARTIAL", "DRAFT"] } },
      include: { client: true },
    });

    const results: BankReconciliationMatch[] = [];

    for (const entry of entries) {
      const entryAmount = Number(entry.amount);
      const entryRef = (entry.bankRefNo || entry.description || "").trim().toLowerCase();
      const entryDate = new Date(entry.entryDate);

      let bestMatch: BankReconciliationMatch | null = null;
      let highestScore = 0;

      for (const inv of openInvoices) {
        const invTotal = Number(inv.totalAmount);
        const invDue = Number(inv.totalAmount) - Number(inv.paidAmount);
        const invRef = (inv.refNo || "").trim().toLowerCase();
        const clientName = (inv.client?.name || inv.client?.nameTh || "").trim().toLowerCase();

        const amountMatch = Math.abs(entryAmount - invDue) < 0.01 || Math.abs(entryAmount - invTotal) < 0.01;
        const referenceMatch = invRef.length > 0 && entryRef.includes(invRef);

        const invDate = new Date(inv.issueDate);
        const diffMs = Math.abs(entryDate.getTime() - invDate.getTime());
        const dateDifferenceDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const clientMatch = clientName.length > 0 && entryRef.includes(clientName);

        // Scoring math
        let score = 0;
        if (amountMatch) score += 50;
        if (referenceMatch) score += 35;
        if (clientMatch) score += 10;
        if (dateDifferenceDays <= 3) score += 5;

        if (score > highestScore && score >= 50) {
          highestScore = score;
          const status = score >= 85 ? "EXACT_MATCH" : score >= 65 ? "PROBABLE_MATCH" : "REVIEW_REQUIRED";

          const explanationParts: string[] = [];
          if (amountMatch) explanationParts.push("ยอดเงินตรงกัน 100%");
          if (referenceMatch) explanationParts.push(`เลขอ้างอิงตรงกัน (${inv.refNo})`);
          if (clientMatch) explanationParts.push("ชื่อลูกค้าระบุในสลิปตรงกัน");
          if (dateDifferenceDays <= 3) {
            explanationParts.push(`วันที่ทำรายการห่างกัน ${dateDifferenceDays} วัน`);
          } else {
            explanationParts.push(`วันที่ต่างกัน ${dateDifferenceDays} วัน`);
          }

          const explanation = `แนะนำจับคู่รายการนี้เนื่องจาก ${explanationParts.join(", ")} (ความเชื่อมั่น ${score}%)`;

          bestMatch = {
            ledgerEntryId: entry.id,
            bankRefNo: entry.bankRefNo,
            ledgerAmount: entryAmount,
            ledgerDate: entryDate.toISOString(),
            matchedInvoiceId: inv.id,
            invoiceRefNo: inv.refNo,
            clientName: inv.client?.nameTh || inv.client?.name || null,
            confidenceScore: score,
            matchStatus: status,
            explanation,
            matchingCriteria: {
              amountMatch,
              referenceMatch,
              dateDifferenceDays,
              clientMatch,
            },
          };
        }
      }

      if (bestMatch) {
        results.push(bestMatch);
      } else {
        results.push({
          ledgerEntryId: entry.id,
          bankRefNo: entry.bankRefNo,
          ledgerAmount: entryAmount,
          ledgerDate: entryDate.toISOString(),
          matchedInvoiceId: null,
          invoiceRefNo: null,
          clientName: null,
          confidenceScore: 0,
          matchStatus: "REVIEW_REQUIRED",
          explanation: "ไม่พบใบแจ้งหนี้ที่มีมูลค่าหรืออ้างอิงตรงกัน ต้องตรวจสอบโดยเจ้าหน้าที่การเงิน",
          matchingCriteria: {
            amountMatch: false,
            referenceMatch: false,
            dateDifferenceDays: 999,
            clientMatch: false,
          },
        });
      }
    }

    return results;
  }
}
