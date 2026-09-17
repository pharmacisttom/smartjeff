import { NextRequest } from "next/server";
import { getInstanceId } from "./fingerprint";

export interface LicenseGuardResult {
  valid: boolean;
  status: "ACTIVE" | "GRACE" | "EXPIRED" | "SUSPENDED";
  expiresAt: string;
  daysRemaining: number;
  activeDays: number;
  features: Record<string, boolean>;
  quota: {
    maxEmployees: number;
    currentEmployees: number;
  };
}

export async function licenseGuard(req?: NextRequest): Promise<LicenseGuardResult> {
  const instanceId = await getInstanceId();
  const licenseKey = process.env.LICENSE_KEY || "SMARTO-LIC-2026-J2K-RAYONG-89A0";

  // Mock license state based on application logic
  const now = new Date();
  const activationDate = new Date("2026-01-01");
  const expiryDate = new Date("2027-09-16");

  const diffTime = Math.abs(now.getTime() - activationDate.getTime());
  const activeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const remainingDiff = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(remainingDiff / (1000 * 60 * 60 * 24));

  let status: "ACTIVE" | "GRACE" | "EXPIRED" | "SUSPENDED" = "ACTIVE";
  if (daysRemaining <= 0 && daysRemaining >= -7) {
    status = "GRACE";
  } else if (daysRemaining < -7) {
    status = "EXPIRED";
  }

  return {
    valid: status === "ACTIVE" || status === "GRACE",
    status,
    expiresAt: expiryDate.toISOString().split("T")[0],
    daysRemaining,
    activeDays,
    features: {
      ai_chat: true,
      live_map: true,
      pdf_export: true,
      qr_scan: true,
    },
    quota: {
      maxEmployees: 100,
      currentEmployees: 40,
    },
  };
}
