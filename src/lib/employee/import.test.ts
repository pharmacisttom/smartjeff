import { describe, expect, it } from "vitest";
import { parseEmployeeRows } from "./import";

describe("employee spreadsheet parser", () => {
  it("reads the legacy jeffsallary employee layout", () => {
    const result = parseEmployeeRows([
      ["รายชื่อพนักงาน"],
      ["ลำดับ", "รหัส", "ชื่อ  -  นามสกุล", "ตำแหน่ง", "", "วันที่เริ่มงาน", "วันเกิด", "อายุ", "เพศ", "สัญชาติ", "เลขบัตรประชาชน", "เบอร์โทรศัพท์"],
      [1, "EMP001", "นายสมชาย ใจดี", "พนักงาน", "AAM", "2026-01-01", "1990-01-01", "", "ชาย", "ไทย", "1-1017-00203-45-0", "0812345678"],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.rows[0]).toMatchObject({
      code: "EMP001",
      prefix: "นาย",
      firstName: "สมชาย",
      lastName: "ใจดี",
      siteCode: "AAM",
      nationality: "ไทย",
      idCardNo: "1101700203450",
    });
  });

  it("supports foreign document numbers without Thai ID rules", () => {
    const result = parseEmployeeRows([
      ["รหัสพนักงาน", "ชื่อ", "นามสกุล", "ตำแหน่ง", "รหัสไซต์", "สัญชาติ", "เลขบัตรประชาชน"],
      ["EMP002", "Sok", "San", "Cleaner", "AAM", "กัมพูชา", "PP-A12345"],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.rows[0].idCardNo).toBe("PP-A12345");
  });
});
