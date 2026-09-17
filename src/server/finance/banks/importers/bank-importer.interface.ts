export interface RawBankTransactionRow {
  date: string;
  valueDate?: string;
  description: string;
  reference?: string;
  debit?: number | string;
  credit?: number | string;
  amount?: number | string;
  balance?: number | string;
  externalId?: string;
  [key: string]: any;
}

export interface NormalizedBankTransaction {
  transactionDate: Date;
  valueDate?: Date;
  description: string;
  reference?: string;
  amount: number;
  direction: "CREDIT" | "DEBIT";
  balance?: number;
  externalId?: string;
  hash: string;
}

export interface BankStatementParseResult {
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  closingBalance: number;
  totalCredit: number;
  totalDebit: number;
  transactions: NormalizedBankTransaction[];
  errors: string[];
}

export interface ColumnMappingConfig {
  dateColumn?: string;
  valueDateColumn?: string;
  descriptionColumn?: string;
  referenceColumn?: string;
  debitColumn?: string;
  creditColumn?: string;
  amountColumn?: string;
  balanceColumn?: string;
  dateFormat?: string; // default YYYY-MM-DD or DD/MM/YYYY
}

export interface BankStatementImporter {
  readonly supportedSource: string;
  parse(
    bufferOrContent: Buffer | string,
    accountId: string,
    mapping?: ColumnMappingConfig
  ): Promise<BankStatementParseResult>;
  validate(result: BankStatementParseResult): { isValid: boolean; issues: string[] };
}
