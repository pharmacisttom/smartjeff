import crypto from "crypto";
import { NormalizedBankTransaction, RawBankTransactionRow } from "../importers/bank-importer.interface";

export class TransactionNormalizer {
  /**
   * Generates a deterministic SHA-256 hash to prevent duplicate bank transaction imports.
   * Based on: accountId, ISO date, positive amount, direction, reference, description, and externalId.
   */
  static generateHash(
    accountId: string,
    txDate: Date,
    amount: number,
    direction: "CREDIT" | "DEBIT",
    description: string,
    reference?: string,
    externalId?: string
  ): string {
    const dateStr = txDate.toISOString().split("T")[0];
    const cleanAmount = Math.abs(amount).toFixed(2);
    const cleanRef = (reference || "").trim().toLowerCase();
    const cleanDesc = description.trim().toLowerCase().replace(/\s+/g, " ");
    const cleanExtId = (externalId || "").trim();

    const rawSignature = `${accountId}|${dateStr}|${cleanAmount}|${direction}|${cleanRef}|${cleanDesc}|${cleanExtId}`;
    return crypto.createHash("sha256").update(rawSignature).digest("hex");
  }

  /**
   * Parse flexible date strings (ISO, DD/MM/YYYY, YYYY/MM/DD, DD-MM-YYYY, timestamp)
   */
  static parseDate(val: any): Date {
    if (!val) return new Date();
    if (val instanceof Date) return val;

    const str = String(val).trim();
    // Excel serial date number
    if (/^\d{5}(\.\d+)?$/.test(str)) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      return new Date(excelEpoch.getTime() + parseFloat(str) * 86400000);
    }

    // Check DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      const year = parseInt(ddmmyyyy[3], 10);
      return new Date(Date.UTC(year, month, day));
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    return new Date();
  }

  /**
   * Safely parse number string with commas or brackets for negatives (e.g. "(1,250.00)")
   */
  static parseAmount(val: any): number {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;

    let str = String(val).trim();
    let isNegative = false;
    if (str.startsWith("(") && str.endsWith(")")) {
      isNegative = true;
      str = str.substring(1, str.length - 1);
    } else if (str.startsWith("-")) {
      isNegative = true;
      str = str.substring(1);
    }

    str = str.replace(/,/g, "").trim();
    const num = parseFloat(str);
    if (isNaN(num)) return 0;
    return isNegative ? -num : num;
  }

  /**
   * Normalize a row into a structured NormalizedBankTransaction
   */
  static normalizeRow(
    row: RawBankTransactionRow,
    accountId: string
  ): NormalizedBankTransaction | null {
    const txDate = this.parseDate(row.date);
    const valueDate = row.valueDate ? this.parseDate(row.valueDate) : undefined;
    const description = (row.description || "Bank Transaction").trim();
    const reference = row.reference ? String(row.reference).trim() : undefined;
    const externalId = row.externalId ? String(row.externalId).trim() : undefined;

    let amount = 0;
    let direction: "CREDIT" | "DEBIT" = "CREDIT";

    if (row.credit !== undefined && row.credit !== "" && this.parseAmount(row.credit) > 0) {
      amount = this.parseAmount(row.credit);
      direction = "CREDIT";
    } else if (row.debit !== undefined && row.debit !== "" && this.parseAmount(row.debit) > 0) {
      amount = this.parseAmount(row.debit);
      direction = "DEBIT";
    } else if (row.amount !== undefined) {
      const parsedAmt = this.parseAmount(row.amount);
      if (parsedAmt < 0) {
        amount = Math.abs(parsedAmt);
        direction = "DEBIT";
      } else {
        amount = parsedAmt;
        direction = "CREDIT";
      }
    }

    if (amount <= 0) {
      return null;
    }

    const balance = row.balance !== undefined && row.balance !== "" ? this.parseAmount(row.balance) : undefined;

    const hash = this.generateHash(
      accountId,
      txDate,
      amount,
      direction,
      description,
      reference,
      externalId
    );

    return {
      transactionDate: txDate,
      valueDate,
      description,
      reference,
      amount: Math.round(amount * 100) / 100,
      direction,
      balance: balance !== undefined ? Math.round(balance * 100) / 100 : undefined,
      externalId,
      hash,
    };
  }
}
