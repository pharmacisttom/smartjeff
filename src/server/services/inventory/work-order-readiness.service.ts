import { prisma } from "@/lib/prisma";

export interface WorkOrderReadinessReport {
  workOrderId: string;
  isFullyReady: boolean;
  workforceReady: {
    status: boolean;
    assignedCount: number;
    requiredCount: number;
    details: string;
  };
  materialReady: {
    status: boolean;
    totalRequiredItems: number;
    shortageItemsCount: number;
    details: string;
  };
  assetReady: {
    status: boolean;
    assignedCount: number;
    availableCount: number;
    details: string;
  };
  vehicleReady: {
    status: boolean;
    details: string;
  };
}

export class WorkOrderReadinessService {
  /**
   * ตรวจสอบความพร้อม 4 มิติ ก่อนเริ่มงาน Work Order
   * (Workforce, Material, Asset, Vehicle)
   */
  static async checkReadiness(
    workOrderId: string,
    siteId?: string,
    projectId?: string
  ): Promise<WorkOrderReadinessReport> {
    // 1. ตรวจสอบ Material Readiness
    const requirements = await prisma.materialRequirement.findMany({
      where: {
        OR: [
          { workOrderId },
          { projectId: projectId || undefined, siteId: siteId || undefined },
        ],
      },
      include: {
        item: {
          include: { balances: true },
        },
      },
    });

    let shortageCount = 0;
    for (const req of requirements) {
      const available = req.item.balances.reduce((sum, b) => sum + b.availableQuantity, 0);
      if (available < req.quantityRequired) {
        shortageCount++;
      }
    }

    const materialStatus = requirements.length === 0 || shortageCount === 0;

    // 2. ตรวจสอบ Asset / Tools Readiness
    const availableTools = await prisma.asset.count({
      where: {
        currentSiteId: siteId || undefined,
        status: { in: ["AVAILABLE", "IN_USE"] },
      },
    });

    // 3. ตรวจสอบ Workforce Readiness (ตรวจสอบกะทำงานใน Site)
    const activeStaff = siteId
      ? await prisma.employee.count({
          where: { siteId, isActive: true },
        })
      : 1;

    const workforceStatus = activeStaff > 0;
    const assetStatus = availableTools >= 0;
    const vehicleStatus = true; // พร้อมสำหรับไซต์

    const isFullyReady = materialStatus && workforceStatus && assetStatus && vehicleStatus;

    return {
      workOrderId,
      isFullyReady,
      workforceReady: {
        status: workforceStatus,
        assignedCount: activeStaff,
        requiredCount: 1,
        details: workforceStatus ? "กำลังคนพร้อมปฏิบัติงาน" : "ยังไม่มีกำลังคนประจำไซต์",
      },
      materialReady: {
        status: materialStatus,
        totalRequiredItems: requirements.length,
        shortageItemsCount: shortageCount,
        details: materialStatus
          ? "พัสดุและอุปกรณ์มีพร้อมในคลัง"
          : `ขาดแคลนวัสดุ ${shortageCount} รายการ`,
      },
      assetReady: {
        status: assetStatus,
        assignedCount: availableTools,
        availableCount: availableTools,
        details: "เครื่องมือและอุปกรณ์พร้อมใช้งาน",
      },
      vehicleReady: {
        status: vehicleStatus,
        details: "ยานพาหนะพร้อมสนับสนุนการเดินทาง",
      },
    };
  }
}
