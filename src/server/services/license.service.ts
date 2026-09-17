import { prisma } from "@/lib/prisma";

export interface LicenseInfo {
  licenseKey: string; clientName: string; activationDate: string; expiryDate: string;
  activeDays: number; remainingDays: number; status: "ACTIVE" | "WARNING_NEAR_EXPIRY" | "EXPIRED";
  maxEmployees: number; currentEmployees: number; planName: string;
}

export class LicenseService {
  static async getLicenseStatus(): Promise<LicenseInfo> {
    const activation = process.env.LICENSE_ACTIVATION_DATE;
    const expiry = process.env.LICENSE_EXPIRY_DATE;
    const licenseKey = process.env.LICENSE_KEY;
    const maxEmployees = Number(process.env.LICENSE_MAX_EMPLOYEES);
    if (!activation || !expiry || !licenseKey || !Number.isInteger(maxEmployees) || maxEmployees <= 0) {
      throw new Error("License configuration is incomplete");
    }
    const activationDate = new Date(activation);
    const expiryDate = new Date(expiry);
    if (Number.isNaN(activationDate.valueOf()) || Number.isNaN(expiryDate.valueOf())) throw new Error("License dates are invalid");
    const now = new Date();
    const day = 86_400_000;
    const remainingDays = Math.floor((expiryDate.valueOf() - now.valueOf()) / day);
    const organization = await prisma.organization.findFirst({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
    const currentEmployees = await prisma.employee.count({ where: { isActive: true } });
    return { licenseKey, clientName: organization?.name || process.env.APP_NAME || "SmartJeff",
      activationDate: activationDate.toISOString().slice(0, 10), expiryDate: expiryDate.toISOString().slice(0, 10),
      activeDays: Math.max(0, Math.floor((now.valueOf() - activationDate.valueOf()) / day)), remainingDays: Math.max(0, remainingDays),
      status: remainingDays <= 0 ? "EXPIRED" : remainingDays <= 30 ? "WARNING_NEAR_EXPIRY" : "ACTIVE",
      maxEmployees, currentEmployees, planName: process.env.LICENSE_PLAN_NAME || "Enterprise" };
  }

  static async renewLicense(_key?: string): Promise<never> {
    throw new Error("License renewal must be completed by the configured licensing provider");
  }
}
