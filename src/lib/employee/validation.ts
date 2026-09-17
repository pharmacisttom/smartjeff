export function normalizeDigits(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function isThaiNationality(value: unknown): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["ไทย", "thai", "th", "thailand"].includes(normalized);
}

export function isValidThaiId(value: unknown): boolean {
  const digits = normalizeDigits(value);
  if (!/^\d{13}$/.test(digits)) return false;

  const checksum = digits
    .slice(0, 12)
    .split("")
    .reduce((sum, digit, index) => sum + Number(digit) * (13 - index), 0);

  return (11 - (checksum % 11)) % 10 === Number(digits[12]);
}

export function validateIdentity(nationality: unknown, idCardNo: unknown): string | null {
  if (!isThaiNationality(nationality)) return null;
  if (!normalizeDigits(idCardNo)) return "พนักงานสัญชาติไทยต้องระบุเลขบัตรประชาชน 13 หลัก";
  if (!isValidThaiId(idCardNo)) return "เลขบัตรประชาชนไทยไม่ถูกต้อง กรุณาตรวจสอบเลข 13 หลัก";
  return null;
}
