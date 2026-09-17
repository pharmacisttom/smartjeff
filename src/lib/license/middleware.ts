import { LicenseService } from "@/server/services/license.service";

export async function licenseGuard() {
  try {
    const license = await LicenseService.getLicenseStatus();
    return { valid: license.status !== "EXPIRED", status: license.status, expiresAt: license.expiryDate,
      daysRemaining: license.remainingDays, activeDays: license.activeDays,
      features: { ai_chat: process.env.FEATURE_AI_COPILOT === "true", live_map: true, pdf_export: true, qr_scan: true },
      quota: { maxEmployees: license.maxEmployees, currentEmployees: license.currentEmployees } };
  } catch {
    return { valid: false, status: "SUSPENDED" as const, expiresAt: "", daysRemaining: 0, activeDays: 0,
      features: { ai_chat: false, live_map: false, pdf_export: false, qr_scan: false }, quota: { maxEmployees: 0, currentEmployees: 0 } };
  }
}
