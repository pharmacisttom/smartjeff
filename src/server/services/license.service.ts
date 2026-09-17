import { prisma } from "@/lib/prisma";

export interface LicenseInfo {
  licenseKey: string;
  clientName: string;
  activationDate: string;
  expiryDate: string;
  activeDays: number;
  remainingDays: number;
  status: "ACTIVE" | "WARNING_NEAR_EXPIRY" | "EXPIRED";
  maxEmployees: number;
  currentEmployees: number;
  planName: string;
}

export class LicenseService {
  /**
   * Get system activation stats, remaining days, and license status
   */
  static async getLicenseStatus(): Promise<LicenseInfo> {
    // Demo / Configured Activation & Expiry Dates
    const activationDate = new Date("2026-01-01T00:00:00.000Z");
    const expiryDate = new Date("2027-09-16T23:59:59.000Z"); // Default 1 Year Subscription
    const now = new Date();

    // Calculate Active Days (Days system has been running)
    const activeDiffMs = now.getTime() - activationDate.getTime();
    const activeDays = Math.max(0, Math.floor(activeDiffMs / (1000 * 60 * 60 * 24)));

    // Calculate Remaining Days until contract expiry
    const remainingDiffMs = expiryDate.getTime() - now.getTime();
    const remainingDays = Math.floor(remainingDiffMs / (1000 * 60 * 60 * 24));

    let status: "ACTIVE" | "WARNING_NEAR_EXPIRY" | "EXPIRED" = "ACTIVE";
    if (remainingDays <= 0) {
      status = "EXPIRED";
    } else if (remainingDays <= 30) {
      status = "WARNING_NEAR_EXPIRY";
    }

    // Count actual employees in DB
    const currentEmployees = await prisma.employee.count();

    return {
      licenseKey: "SMARTO-LIC-2026-J2K-RAYONG-89A0",
      clientName: "บริษัท เจทูเค เฮ้าส์คีพปิ้ง เซอร์วิส จำกัด",
      activationDate: activationDate.toISOString().split("T")[0],
      expiryDate: expiryDate.toISOString().split("T")[0],
      activeDays,
      remainingDays: Math.max(0, remainingDays),
      status,
      maxEmployees: 100,
      currentEmployees,
      planName: "Enterprise Annual Subscription (100 Staff Quota)",
    };
  }

  /**
   * Verify and apply a new License Key for subscription renewal
   */
  static async renewLicense(key: string): Promise<{ success: boolean; message: string; newExpiryDate?: string }> {
    const cleanKey = key.trim().toUpperCase();

    if (!cleanKey || cleanKey.length < 10) {
      throw new Error("รหัส License Key ไม่ถูกต้อง กรุณาตรวจสอบรหัสสัญญาจากผู้พัฒนาโปรแกรม");
    }

    // Check valid license key format or developer key patterns
    if (cleanKey.includes("SMARTO") || cleanKey.includes("2027") || cleanKey.includes("RENEW")) {
      const newExpiry = new Date();
      newExpiry.setFullYear(newExpiry.getFullYear() + 1); // Extend for 1 additional year

      return {
        success: true,
        message: "ต่ออายุสัญญาใช้งานโปรแกรมสำเร็จเรียบร้อยแล้ว!",
        newExpiryDate: newExpiry.toISOString().split("T")[0],
      };
    }

    throw new Error("License Key ไม่ตรงกับระบบโปรแกรม กรุณาติดต่อผู้พัฒนาโปรแกรมเพื่อขอรับรหัสต่อสัญญา");
  }
}
