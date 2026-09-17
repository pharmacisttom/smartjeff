import { prisma } from "@/lib/prisma";
import { GenericCSVImporter } from "@/server/finance/banks/importers/csv-importer";
import { GenericXLSXImporter } from "@/server/finance/banks/importers/xlsx-importer";
import {
  BankStatementParseResult,
  ColumnMappingConfig,
} from "@/server/finance/banks/importers/bank-importer.interface";

export class BankStatementImportService {
  /**
   * Preview a bank statement before committing to database
   */
  static async previewStatement(
    bufferOrContent: Buffer | string,
    fileType: "CSV" | "XLSX",
    financialAccountId: string,
    mapping?: ColumnMappingConfig
  ): Promise<BankStatementParseResult> {
    const account = await prisma.financialAccount.findUnique({
      where: { id: financialAccountId },
    });
    if (!account) {
      throw new Error(`FinancialAccount with id ${financialAccountId} not found.`);
    }

    const importer = fileType === "XLSX" ? new GenericXLSXImporter() : new GenericCSVImporter();
    const result = await importer.parse(bufferOrContent, financialAccountId, mapping);
    return result;
  }

  /**
   * Import bank statement and all normalized transactions
   */
  static async importStatement(options: {
    financialAccountId: string;
    fileName: string;
    sourceType: "CSV" | "XLSX" | "MANUAL" | "API";
    bufferOrContent: Buffer | string;
    importedBy: string;
    mapping?: ColumnMappingConfig;
  }) {
    const account = await prisma.financialAccount.findUnique({
      where: { id: options.financialAccountId },
    });
    if (!account) {
      throw new Error(`FinancialAccount not found.`);
    }

    const importer =
      options.sourceType === "XLSX" ? new GenericXLSXImporter() : new GenericCSVImporter();
    const parsed = await importer.parse(
      options.bufferOrContent,
      options.financialAccountId,
      options.mapping
    );

    const validation = importer.validate(parsed);
    if (!validation.isValid && parsed.transactions.length === 0) {
      throw new Error(`Invalid statement: ${validation.issues.join(", ")}`);
    }

    // Check for duplicate statement within same period for same account
    const existingStatement = await prisma.bankStatement.findFirst({
      where: {
        financialAccountId: options.financialAccountId,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        status: { not: "LOCKED" },
      },
    });

    const statementCount = await prisma.bankStatement.count();
    const statementNo = `STMT-${new Date().getFullYear()}-${String(statementCount + 1).padStart(5, "0")}`;

    const statement = await prisma.bankStatement.create({
      data: {
        statementNo,
        financialAccountId: options.financialAccountId,
        statementDate: parsed.statementDate,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        openingBalance: parsed.openingBalance,
        closingBalance: parsed.closingBalance,
        currency: account.currency,
        sourceType: options.sourceType,
        fileName: options.fileName,
        importedBy: options.importedBy,
        status: "PROCESSING",
        notes: existingStatement
          ? `Warning: overlapping statement with ${existingStatement.statementNo}`
          : undefined,
      },
    });

    let importedCount = 0;
    let duplicateCount = 0;

    for (const tx of parsed.transactions) {
      // Check duplicate by SHA-256 hash
      const existingTx = await prisma.bankTransaction.findUnique({
        where: { hash: tx.hash },
      });

      if (existingTx) {
        duplicateCount++;
        continue;
      }

      await prisma.bankTransaction.create({
        data: {
          statementId: statement.id,
          financialAccountId: options.financialAccountId,
          transactionDate: tx.transactionDate,
          valueDate: tx.valueDate,
          description: tx.description,
          reference: tx.reference,
          amount: tx.amount,
          direction: tx.direction,
          balance: tx.balance,
          externalId: tx.externalId,
          hash: tx.hash,
          status: "UNMATCHED",
        },
      });
      importedCount++;
    }

    // Update statement status
    await prisma.bankStatement.update({
      where: { id: statement.id },
      data: {
        status: "RECONCILING",
      },
    });

    // Update account's last bank balance
    await prisma.financialAccount.update({
      where: { id: options.financialAccountId },
      data: {
        lastBankBalance: parsed.closingBalance,
      },
    });

    return {
      statementId: statement.id,
      statementNo: statement.statementNo,
      totalParsed: parsed.transactions.length,
      importedCount,
      duplicateCount,
      openingBalance: parsed.openingBalance,
      closingBalance: parsed.closingBalance,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      isDuplicateStatementWarning: !!existingStatement,
    };
  }
}
