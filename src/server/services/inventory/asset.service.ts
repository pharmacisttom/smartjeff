import { prisma } from "@/lib/prisma";

export class AssetService {
  static async getAssets(filter?: {
    category?: string;
    status?: string;
    siteId?: string;
    search?: string;
  }) {
    const where: any = {};
    if (filter?.category) where.category = filter.category;
    if (filter?.status) where.status = filter.status;
    if (filter?.siteId) where.currentSiteId = filter.siteId;
    if (filter?.search) {
      where.OR = [
        { assetCode: { contains: filter.search } },
        { name: { contains: filter.search } },
        { serialNo: { contains: filter.search } },
      ];
    }

    return prisma.asset.findMany({
      where,
      include: {
        item: true,
        toolAssignments: {
          where: { status: "ISSUED" },
          include: { employee: true },
        },
        inspections: {
          orderBy: { inspectionDate: "desc" },
          take: 1,
        },
      },
      orderBy: { assetCode: "asc" },
    });
  }

  static async getAssetById(id: string) {
    return prisma.asset.findUnique({
      where: { id },
      include: {
        item: true,
        assignments: { orderBy: { assignedAt: "desc" } },
        toolAssignments: {
          include: { employee: true },
          orderBy: { issuedAt: "desc" },
        },
        inspections: { orderBy: { inspectionDate: "desc" } },
      },
    });
  }

  static async createAsset(data: {
    assetCode: string;
    itemId?: string;
    name: string;
    serialNo?: string;
    category: string;
    purchaseDate?: Date;
    purchaseCost?: number;
    currentSiteId?: string;
    currentEmployeeId?: string;
    status?: string;
    warrantyExpiry?: Date;
  }) {
    const qrCode = `ASSET:${data.assetCode}`;

    return prisma.asset.create({
      data: {
        assetCode: data.assetCode,
        itemId: data.itemId,
        name: data.name,
        serialNo: data.serialNo,
        category: data.category,
        purchaseDate: data.purchaseDate,
        purchaseCost: data.purchaseCost ?? 0,
        currentSiteId: data.currentSiteId,
        currentEmployeeId: data.currentEmployeeId,
        status: data.status || "AVAILABLE",
        warrantyExpiry: data.warrantyExpiry,
        qrCode,
      },
      include: { item: true },
    });
  }

  static async updateAsset(
    id: string,
    data: {
      name?: string;
      category?: string;
      currentSiteId?: string;
      currentEmployeeId?: string;
      status?: string;
      warrantyExpiry?: Date;
    }
  ) {
    return prisma.asset.update({
      where: { id },
      data,
    });
  }

  /**
   * ยืมเครื่องมือ (Tool Assignment)
   */
  static async assignTool(data: {
    assetId: string;
    employeeId: string;
    siteId?: string;
    expectedReturnAt?: Date;
    issuedBy: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findUnique({ where: { id: data.assetId } });
      if (!asset) throw new Error("ไม่พบเครื่องมือที่ระบุ");
      if (asset.status !== "AVAILABLE") {
        throw new Error(`เครื่องมือไม่อยู่ในสถานะพร้อมใช้งาน (สถานะปัจจุบัน: ${asset.status})`);
      }

      // 1. สร้าง ToolAssignment
      const assignment = await tx.toolAssignment.create({
        data: {
          assetId: data.assetId,
          employeeId: data.employeeId,
          siteId: data.siteId,
          expectedReturnAt: data.expectedReturnAt,
          issuedBy: data.issuedBy,
          status: "ISSUED",
          receivedCondition: "GOOD",
        },
      });

      // 2. อัปเดตสถานะ Asset
      await tx.asset.update({
        where: { id: data.assetId },
        data: {
          status: "IN_USE",
          currentEmployeeId: data.employeeId,
          currentSiteId: data.siteId,
        },
      });

      return assignment;
    });
  }

  /**
   * คืนเครื่องมือ (Tool Return)
   */
  static async returnTool(assignmentId: string, receivedCondition: string = "GOOD") {
    return prisma.$transaction(async (tx) => {
      const assignment = await tx.toolAssignment.findUnique({
        where: { id: assignmentId },
      });
      if (!assignment || assignment.status !== "ISSUED") {
        throw new Error("รายการยืมเครื่องมือนี้ได้รับการคืนแล้ว หรือไม่ถูกต้อง");
      }

      // 1. อัปเดตสถานะ Assignment
      const updated = await tx.toolAssignment.update({
        where: { id: assignmentId },
        data: {
          status: "RETURNED",
          returnedAt: new Date(),
          receivedCondition,
        },
      });

      // 2. ปรับสถานะ Asset กลับเป็น AVAILABLE (หรือ MAINTENANCE/DAMAGED หากสภาพชำรุด)
      const nextStatus =
        receivedCondition === "DAMAGED"
          ? "DAMAGED"
          : receivedCondition === "NEEDS_MAINTENANCE"
          ? "MAINTENANCE"
          : "AVAILABLE";

      await tx.asset.update({
        where: { id: assignment.assetId },
        data: {
          status: nextStatus,
          currentEmployeeId: null,
        },
      });

      return updated;
    });
  }

  /**
   * ตรวจสภาพทรัพย์สิน (Asset Inspection)
   */
  static async inspectAsset(data: {
    assetId: string;
    inspectorId: string;
    result: "PASS" | "WARNING" | "FAIL";
    checklistJson?: string;
    notes?: string;
    photoUrl?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const inspection = await tx.assetInspection.create({
        data: {
          assetId: data.assetId,
          inspectorId: data.inspectorId,
          result: data.result,
          checklistJson: data.checklistJson,
          notes: data.notes,
          photoUrl: data.photoUrl,
        },
      });

      if (data.result === "FAIL") {
        await tx.asset.update({
          where: { id: data.assetId },
          data: { status: "MAINTENANCE" },
        });
      }

      return inspection;
    });
  }

  /**
   * รายงานทรัพย์สินชำรุดหรือสูญหาย (ห้าม Hard Delete)
   */
  static async reportDamagedOrLost(
    assetId: string,
    status: "DAMAGED" | "LOST",
    reason: string
  ) {
    return prisma.asset.update({
      where: { id: assetId },
      data: {
        status,
      },
    });
  }
}
