import { isThaiNationality, normalizeDigits, validateIdentity } from "./validation";

export type SpreadsheetRow = Array<unknown>;

export interface EmployeeImportRow {
  rowNumber: number;
  code: string;
  prefix: string | null;
  firstName: string;
  lastName: string;
  position: string;
  siteCode: string;
  startDate: Date | null;
  birthDate: Date | null;
  gender: string;
  nationality: string;
  idCardNo: string | null;
  phone: string | null;
  bankAccount: string | null;
  bankName: string | null;
  insurance: string | null;
  hospital: string | null;
  education: string | null;
  hometown: string | null;
  salaryType: string;
  baseSalary: number;
  dailyRate: number;
}

export interface EmployeeImportError { row: number; code?: string; message: string }

const aliases: Record<string, string[]> = {
  code: ["รหัสพนักงาน", "รหัส", "code", "employee code"],
  prefix: ["คำนำหน้า", "prefix"],
  firstName: ["ชื่อ", "firstname", "first name"],
  lastName: ["นามสกุล", "lastname", "last name"],
  fullName: ["ชื่อ-นามสกุล", "ชื่อ  -  นามสกุล", "ชื่อ นามสกุล", "fullname", "full name"],
  position: ["ตำแหน่ง", "position"],
  siteCode: ["รหัสไซต์", "ไซต์", "สาขา", "โรงงาน", "site", "site code"],
  startDate: ["วันที่เริ่มงาน", "วันเริ่มงาน", "start date"],
  birthDate: ["วันเกิด", "birth date", "date of birth"],
  gender: ["เพศ", "gender"],
  nationality: ["สัญชาติ", "nationality"],
  idCardNo: ["เลขบัตรประชาชน", "เลขประจำตัวประชาชน", "บัตรประชาชน", "id card", "national id"],
  phone: ["เบอร์โทรศัพท์", "เบอร์โทร", "โทรศัพท์", "phone"],
  bankAccount: ["เลขบัญชีธนาคาร", "เลขบัญชี", "bank account"],
  bankName: ["ธนาคาร", "bank"],
  insurance: ["สิทธิการรักษา", "ประกันสังคม", "insurance"],
  hospital: ["โรงพยาบาล", "รพ.", "hospital"],
  education: ["การศึกษา", "education"],
  hometown: ["ภูมิลำเนา", "hometown"],
  salaryType: ["ประเภทค่าจ้าง", "รูปแบบเงินเดือน", "salary type"],
  baseSalary: ["เงินเดือน", "รายเดือน", "base salary"],
  dailyRate: ["ค่าแรงรายวัน", "รายวัน", "daily rate"],
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function headerKey(value: unknown): string {
  return clean(value).toLowerCase().replace(/[\s_-]+/g, " ");
}

function findHeader(rows: SpreadsheetRow[]) {
  for (let index = 0; index < Math.min(rows.length, 20); index += 1) {
    const normalized = rows[index].map(headerKey);
    const hasCode = aliases.code.some((alias) => normalized.includes(headerKey(alias)));
    const hasName = [...aliases.fullName, ...aliases.firstName].some((alias) => normalized.includes(headerKey(alias)));
    if (hasCode && hasName) return index;
  }
  return -1;
}

function columnMap(header: SpreadsheetRow): Record<string, number> {
  const normalized = header.map(headerKey);
  return Object.fromEntries(Object.entries(aliases).map(([field, names]) => [
    field,
    normalized.findIndex((cell) => names.some((name) => cell === headerKey(name))),
  ]));
}

function valueAt(row: SpreadsheetRow, columns: Record<string, number>, field: string): string {
  const index = columns[field];
  return index >= 0 ? clean(row[index]) : "";
}

function parseName(fullName: string, explicitPrefix: string, firstName: string, lastName: string) {
  if (firstName) return { prefix: explicitPrefix || null, firstName, lastName };
  let remaining = fullName.replace(/\s+/g, " ").trim();
  const detected = ["นางสาว", "นาย", "นาง", "น.ส.", "Mr.", "Mrs.", "Ms."].find((item) => remaining.startsWith(item));
  const prefix = explicitPrefix || detected || null;
  if (detected) remaining = remaining.slice(detected.length).trim();
  const parts = remaining.split(" ").filter(Boolean);
  return { prefix, firstName: parts.shift() || "", lastName: parts.join(" ") };
}

function parseDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseAmount(value: string): number {
  const number = Number(value.replace(/,/g, ""));
  return Number.isFinite(number) ? number : 0;
}

export function parseEmployeeRows(rows: SpreadsheetRow[]): { rows: EmployeeImportRow[]; errors: EmployeeImportError[] } {
  const headerIndex = findHeader(rows);
  if (headerIndex < 0) return { rows: [], errors: [{ row: 0, message: "ไม่พบหัวตารางรหัสพนักงานและชื่อพนักงาน" }] };

  const columns = columnMap(rows[headerIndex]);
  const legacyJeffSalary = headerKey(rows[headerIndex][1]) === "รหัส" && headerKey(rows[headerIndex][2]).includes("ชื่อ");
  if (legacyJeffSalary && columns.siteCode < 0) columns.siteCode = 4;
  if (legacyJeffSalary && columns.hospital < 0) columns.hospital = 15;

  const parsedRows: EmployeeImportRow[] = [];
  const errors: EmployeeImportError[] = [];
  const seenCodes = new Set<string>();

  rows.slice(headerIndex + 1).forEach((source, offset) => {
    const rowNumber = headerIndex + offset + 2;
    const code = valueAt(source, columns, "code");
    const fullName = valueAt(source, columns, "fullName");
    const explicitFirstName = valueAt(source, columns, "firstName");
    if (!code && !fullName && !explicitFirstName) return;

    const name = parseName(fullName, valueAt(source, columns, "prefix"), explicitFirstName, valueAt(source, columns, "lastName"));
    const nationality = valueAt(source, columns, "nationality") || "ไทย";
    const rawIdCardNo = valueAt(source, columns, "idCardNo");
    const idCardNo = rawIdCardNo ? (isThaiNationality(nationality) ? normalizeDigits(rawIdCardNo) : rawIdCardNo.trim()) : null;
    const position = valueAt(source, columns, "position");
    const siteCode = valueAt(source, columns, "siteCode").toUpperCase();
    const rowErrors: string[] = [];

    if (!code) rowErrors.push("ไม่พบรหัสพนักงาน");
    if (!name.firstName) rowErrors.push("ไม่พบชื่อ");
    if (!name.lastName) rowErrors.push("ไม่พบนามสกุล");
    if (!position) rowErrors.push("ไม่พบตำแหน่ง");
    if (!siteCode) rowErrors.push("ไม่พบรหัสไซต์");
    const identityError = validateIdentity(nationality, idCardNo);
    if (identityError) rowErrors.push(identityError);
    if (seenCodes.has(code)) rowErrors.push("รหัสพนักงานซ้ำในไฟล์");
    seenCodes.add(code);

    if (rowErrors.length) {
      errors.push({ row: rowNumber, code: code || undefined, message: rowErrors.join(", ") });
      return;
    }

    const salaryTypeValue = valueAt(source, columns, "salaryType").toUpperCase();
    const baseSalary = parseAmount(valueAt(source, columns, "baseSalary"));
    const dailyRate = parseAmount(valueAt(source, columns, "dailyRate"));
    parsedRows.push({
      rowNumber, code, ...name, position, siteCode,
      startDate: parseDate(valueAt(source, columns, "startDate")),
      birthDate: parseDate(valueAt(source, columns, "birthDate")),
      gender: valueAt(source, columns, "gender").includes("หญิง") ? "FEMALE" : "MALE",
      nationality,
      idCardNo: isThaiNationality(nationality) ? idCardNo : idCardNo || null,
      phone: valueAt(source, columns, "phone") || null,
      bankAccount: normalizeDigits(valueAt(source, columns, "bankAccount")) || null,
      bankName: valueAt(source, columns, "bankName") || null,
      insurance: valueAt(source, columns, "insurance") || null,
      hospital: valueAt(source, columns, "hospital") || null,
      education: valueAt(source, columns, "education") || null,
      hometown: valueAt(source, columns, "hometown") || null,
      salaryType: salaryTypeValue === "DAILY" || salaryTypeValue.includes("รายวัน") || (!baseSalary && dailyRate) ? "DAILY" : "MONTHLY",
      baseSalary: baseSalary || 12000,
      dailyRate: dailyRate || 400,
    });
  });

  return { rows: parsedRows, errors };
}
