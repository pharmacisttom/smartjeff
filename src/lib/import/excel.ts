import crypto from "node:crypto";
import * as XLSX from "xlsx";

export const IMPORT_TYPES = ["EMPLOYEE", "USER", "CLIENT", "SITE", "SHIFT", "ATTENDANCE", "PAYROLL_POLICY", "PAYROLL", "PAYSLIP", "EMPLOYEE_DEPLOYMENT"] as const;
export type ImportType = typeof IMPORT_TYPES[number];
export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export interface SheetAnalysis {
  name: string;
  range: string | null;
  rowCount: number;
  columnCount: number;
  formulaCells: number;
  candidateHeaderRows: Array<{ row: number; nonEmptyCells: number }>;
}

export function validateImportFile(fileName: string, size: number): void {
  if (!fileName.toLowerCase().endsWith(".xlsx")) throw new Error("Only .xlsx files are supported.");
  if (size <= 0 || size > MAX_IMPORT_BYTES) throw new Error("The workbook must be between 1 byte and 10 MB.");
}

export function analyzeWorkbook(buffer: Buffer): { fileHash: string; sheets: SheetAnalysis[] } {
  const workbook = XLSX.read(buffer, { type: "buffer", cellFormula: true, cellDates: true });
  if (!workbook.SheetNames.length) throw new Error("The workbook has no worksheets.");
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null, raw: true });
    const range = sheet["!ref"] ? XLSX.utils.decode_range(sheet["!ref"]) : null;
    let formulaCells = 0;
    for (const address of Object.keys(sheet)) if (!address.startsWith("!") && sheet[address]?.f) formulaCells++;
    const candidates = rows.slice(0, 20).map((row, index) => ({
      row: index + 1,
      nonEmptyCells: row.filter((value) => value !== null && value !== "").length,
      stringCells: row.filter((value) => typeof value === "string" && value.trim()).length,
    })).filter((row) => row.stringCells >= 2).sort((a, b) => b.stringCells - a.stringCells || a.row - b.row).slice(0, 3);
    return {
      name,
      range: sheet["!ref"] || null,
      rowCount: range ? range.e.r - range.s.r + 1 : 0,
      columnCount: range ? range.e.c - range.s.c + 1 : 0,
      formulaCells,
      candidateHeaderRows: candidates.map(({ row, nonEmptyCells }) => ({ row, nonEmptyCells })),
    };
  });
  return { fileHash: crypto.createHash("sha256").update(buffer).digest("hex"), sheets };
}
