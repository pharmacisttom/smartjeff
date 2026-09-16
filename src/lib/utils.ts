import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format Thai phone number (e.g., 0812345678 -> 081-234-5678)
 */
export function formatThaiPhone(phone?: string | null): string {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Format Thai National ID card number (e.g., 1209900123456 -> 1-2099-00123-45-6)
 */
export function formatThaiIdCard(idNo?: string | null): string {
  if (!idNo) return "-";
  const cleaned = idNo.replace(/\D/g, "");
  if (cleaned.length === 13) {
    return `${cleaned[0]}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned[12]}`;
  }
  return idNo;
}

/**
 * Checksum validation for Thai National ID
 */
export function isValidThaiIdCard(idNo: string): boolean {
  const cleaned = idNo.replace(/\D/g, "");
  if (cleaned.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i], 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleaned[12], 10);
}

/**
 * Convert Gregorian Year (A.D.) to Buddhist Era (B.E. / พ.ศ.)
 */
export function formatThaiYear(date: Date | string | number): number {
  const d = new Date(date);
  return d.getFullYear() + 543;
}

/**
 * Format Date to Thai localized string (e.g., 16 ก.ย. 2569)
 */
export function formatThaiDate(date?: Date | string | number | null): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  const monthsThai = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
    "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
  ];
  const day = d.getDate();
  const month = monthsThai[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `${day} ${month} ${yearBE}`;
}

/**
 * Format Time (HH:mm)
 */
export function formatTime(date?: Date | string | number | null): string {
  if (!date) return "--:--";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "--:--";
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${mins} น.`;
}

/**
 * Format Currency (Thai Baht)
 */
export function formatBaht(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return "฿0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "฿0.00";
  return `฿${num.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
