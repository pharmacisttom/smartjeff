import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { analyzeWorkbook, MAX_IMPORT_BYTES, validateImportFile } from "./excel";

describe("secure Excel analysis", () => {
  it("accepts only bounded xlsx uploads", () => {
    expect(() => validateImportFile("employees.xlsx", 100)).not.toThrow();
    expect(() => validateImportFile("employees.xls", 100)).toThrow();
    expect(() => validateImportFile("employees.xlsx", MAX_IMPORT_BYTES + 1)).toThrow();
  });

  it("returns structure without workbook cell values", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["Employee Code", "person@example.test", "1234567890123"], ["E001", "Hidden", 1]]), "Employees");
    const result = analyzeWorkbook(Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })));
    expect(result.sheets[0].candidateHeaderRows[0]).toEqual({ row: 1, nonEmptyCells: 3 });
    expect(JSON.stringify(result)).not.toContain("Employee Code");
    expect(JSON.stringify(result)).not.toContain("person@example.test");
    expect(JSON.stringify(result)).not.toContain("1234567890123");
  });
});
