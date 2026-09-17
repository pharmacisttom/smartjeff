import * as XLSX from "xlsx";
import {
  BankStatementImporter,
  BankStatementParseResult,
  ColumnMappingConfig,
  NormalizedBankTransaction,
} from "./bank-importer.interface";
import { TransactionNormalizer } from "../normalizers/transaction-normalizer";

export class GenericXLSXImporter implements BankStatementImporter {
  readonly supportedSource = "XLSX";

  async parse(
    bufferOrContent: Buffer | string,
    accountId: string,
    mapping?: ColumnMappingConfig
  ): Promise<BankStatementParseResult> {
    const buffer = Buffer.isBuffer(bufferOrContent)
      ? bufferOrContent
      : Buffer.from(bufferOrContent, "base64");

    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const errors: string[] = [];
    if (!rawRows || rawRows.length < 2) {
      return {
        statementDate: new Date(),
        periodStart: new Date(),
        periodEnd: new Date(),
        openingBalance: 0,
        closingBalance: 0,
        totalCredit: 0,
        totalDebit: 0,
        transactions: [],
        errors: ["Excel file must contain at least a header row and one transaction row."],
      };
    }

    // Find header index (sometimes bank headers start at row 2 or 3)
    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(10, rawRows.length); r++) {
      const rowStr = rawRows[r].map((c) => String(c || "").toLowerCase()).join(" ");
      if (rowStr.includes("date") || rowStr.includes("amount") || rowStr.includes("balance") || rowStr.includes("debit")) {
        headerRowIdx = r;
        break;
      }
    }

    const headers = (rawRows[headerRowIdx] || []).map((h: any) =>
      String(h || "").toLowerCase().trim()
    );

    const dateIdx = this.findColumnIndex(headers, mapping?.dateColumn || "date", [
      "txn date",
      "transaction date",
      "date",
      "posting date",
    ]);
    const valueDateIdx = this.findColumnIndex(
      headers,
      mapping?.valueDateColumn || "valuedate",
      ["value date", "effective date"]
    );
    const descIdx = this.findColumnIndex(
      headers,
      mapping?.descriptionColumn || "description",
      ["desc", "particulars", "details", "remarks", "narration"]
    );
    const refIdx = this.findColumnIndex(
      headers,
      mapping?.referenceColumn || "reference",
      ["ref", "cheque no", "reference no", "txn id", "chq no"]
    );
    const debitIdx = this.findColumnIndex(
      headers,
      mapping?.debitColumn || "debit",
      ["withdrawal", "dr", "debit amount", "out"]
    );
    const creditIdx = this.findColumnIndex(
      headers,
      mapping?.creditColumn || "credit",
      ["deposit", "cr", "credit amount", "in"]
    );
    const amountIdx = this.findColumnIndex(
      headers,
      mapping?.amountColumn || "amount",
      ["net amount", "txn amount"]
    );
    const balanceIdx = this.findColumnIndex(
      headers,
      mapping?.balanceColumn || "balance",
      ["running balance", "ledger balance"]
    );

    const transactions: NormalizedBankTransaction[] = [];
    let totalCredit = 0;
    let totalDebit = 0;

    for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const dateStr = dateIdx !== -1 ? row[dateIdx] : "";
      const descStr = descIdx !== -1 ? row[descIdx] : "Bank Transaction";
      const refStr = refIdx !== -1 ? row[refIdx] : undefined;
      const debitVal = debitIdx !== -1 ? row[debitIdx] : undefined;
      const creditVal = creditIdx !== -1 ? row[creditIdx] : undefined;
      const amountVal = amountIdx !== -1 ? row[amountIdx] : undefined;
      const balanceVal = balanceIdx !== -1 ? row[balanceIdx] : undefined;
      const valueDateStr = valueDateIdx !== -1 ? row[valueDateIdx] : undefined;

      const normalized = TransactionNormalizer.normalizeRow(
        {
          date: dateStr,
          valueDate: valueDateStr,
          description: String(descStr || "Transaction"),
          reference: refStr !== undefined ? String(refStr) : undefined,
          debit: debitVal,
          credit: creditVal,
          amount: amountVal,
          balance: balanceVal,
        },
        accountId
      );

      if (normalized) {
        transactions.push(normalized);
        if (normalized.direction === "CREDIT") {
          totalCredit += normalized.amount;
        } else {
          totalDebit += normalized.amount;
        }
      }
    }

    const dates = transactions.map((t) => t.transactionDate.getTime());
    const periodStart = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    const periodEnd = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

    const firstBalance = transactions[0]?.balance;
    const lastBalance = transactions[transactions.length - 1]?.balance;

    const openingBalance =
      firstBalance !== undefined
        ? transactions[0].direction === "CREDIT"
          ? firstBalance - transactions[0].amount
          : firstBalance + transactions[0].amount
        : 0;

    const closingBalance =
      lastBalance !== undefined ? lastBalance : openingBalance + totalCredit - totalDebit;

    return {
      statementDate: periodEnd,
      periodStart,
      periodEnd,
      openingBalance: Math.round(openingBalance * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      totalDebit: Math.round(totalDebit * 100) / 100,
      transactions,
      errors,
    };
  }

  validate(result: BankStatementParseResult): { isValid: boolean; issues: string[] } {
    const issues: string[] = [...result.errors];
    if (result.transactions.length === 0) {
      issues.push("No valid transactions found in Excel sheet.");
    }
    return {
      isValid: issues.length === 0 || result.transactions.length > 0,
      issues,
    };
  }

  private findColumnIndex(headers: string[], target: string, aliases: string[]): number {
    const cleanedTarget = target.toLowerCase().trim();
    const directIdx = headers.indexOf(cleanedTarget);
    if (directIdx !== -1) return directIdx;

    // Exact match against aliases first
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      for (const alias of aliases) {
        if (h === alias.toLowerCase().trim()) return i;
      }
    }

    // Substring match only for aliases/targets >= 3 chars
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      if (cleanedTarget.length >= 3 && h.includes(cleanedTarget)) return i;
      for (const alias of aliases) {
        const cleanAlias = alias.toLowerCase().trim();
        if (cleanAlias.length >= 3 && h.includes(cleanAlias)) return i;
      }
    }
    return -1;
  }
}
