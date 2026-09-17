import { NextRequest, NextResponse } from "next/server";
import { generateLicenseKey } from "@/lib/license/key-generator";

// Mock vendor database state for tenants and licenses
let tenants = [
  {
    id: "tenant-j2k",
    code: "J2K",
    name: "J2K Housekeeping Service (ระยอง)",
    legalName: "บริษัท เจทูเค เฮ้าส์กิ๊ปปิ้ง จำกัด",
    taxId: "0215566001234",
    status: "ACTIVE",
    plan: "PRO_100",
    licenseKey: "SMARTO-LIC-2026-J2K-RAYONG-89A0",
    activationDate: "2026-01-01",
    expiryDate: "2027-09-16",
    maxEmployees: 100,
    currentEmployees: 40,
    monthlyPrice: 8500,
  },
  {
    id: "tenant-aam",
    code: "AAM-MAP",
    name: "โรงงาน AAM นิคมฯ มาบตาพุด",
    legalName: "บริษัท เอเอเอ็ม อินดัสเตรียล จำกัด",
    taxId: "0105559012345",
    status: "ACTIVE",
    plan: "ENTERPRISE",
    licenseKey: "SMTO-ENT-2026-B8C9D0E1F2G3-K4L5",
    activationDate: "2026-03-15",
    expiryDate: "2027-03-15",
    maxEmployees: 250,
    currentEmployees: 185,
    monthlyPrice: 24000,
  },
  {
    id: "tenant-amata",
    code: "AMATA-CLEAN",
    name: "อมตะ ซิตี้ เซอร์วิส Hub",
    legalName: "บริษัท อมตะ เซอร์วิสโซลูชัน จำกัด",
    taxId: "0205562009876",
    status: "WARNING_NEAR_EXPIRY",
    plan: "STARTER",
    licenseKey: "SMTO-STR-2026-X1Y2Z3A4B5C6-M7N8",
    activationDate: "2025-10-01",
    expiryDate: "2026-10-01",
    maxEmployees: 50,
    currentEmployees: 48,
    monthlyPrice: 4500,
  },
];

export async function GET() {
  const totalMrr = tenants.reduce((acc, t) => acc + t.monthlyPrice, 0);
  const activeTenants = tenants.filter((t) => t.status === "ACTIVE").length;

  return NextResponse.json({
    success: true,
    stats: {
      totalTenants: tenants.length,
      activeTenants,
      totalMrr,
      totalEmployeesManaged: tenants.reduce((acc, t) => acc + t.currentEmployees, 0),
    },
    tenants,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantCode, planCode, durationYears, customQuota } = body;

    const newKey = generateLicenseKey({
      planCode: planCode || "PRO",
      year: new Date().getFullYear() + (durationYears || 1),
    });

    const targetTenant = tenants.find((t) => t.code === tenantCode || t.id === tenantCode);

    if (targetTenant) {
      const currentExpiry = new Date(targetTenant.expiryDate);
      currentExpiry.setFullYear(currentExpiry.getFullYear() + (durationYears || 1));
      targetTenant.expiryDate = currentExpiry.toISOString().split("T")[0];
      targetTenant.licenseKey = newKey;
      targetTenant.status = "ACTIVE";
      if (customQuota) targetTenant.maxEmployees = customQuota;
    }

    return NextResponse.json({
      success: true,
      licenseKey: newKey,
      message: `สร้าง License Key สำเร็จสำหรับ ${targetTenant?.name || tenantCode}`,
      tenant: targetTenant,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "เกิดข้อผิดพลาดในการสร้าง License Key" },
      { status: 500 }
    );
  }
}
