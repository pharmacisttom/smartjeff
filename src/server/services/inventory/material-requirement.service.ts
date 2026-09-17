import { prisma } from "@/lib/prisma";

export class MaterialRequirementService {
  static async createRequirement(data: {
    itemId: string;
    projectId?: string;
    siteId?: string;
    workOrderId?: string;
    quantityRequired: number;
    requiredDate: Date;
    priority?: string;
    requestedBy: string;
  }) {
    return prisma.materialRequirement.create({
      data: {
        itemId: data.itemId,
        projectId: data.projectId,
        siteId: data.siteId,
        workOrderId: data.workOrderId,
        quantityRequired: data.quantityRequired,
        requiredDate: data.requiredDate,
        priority: data.priority || "NORMAL",
        status: "REQUESTED",
        requestedBy: data.requestedBy,
      },
      include: {
        item: { include: { unit: true } },
        project: true,
      },
    });
  }

  static async getRequirements(filter?: {
    projectId?: string;
    siteId?: string;
    status?: string;
  }) {
    const where: any = {};
    if (filter?.projectId) where.projectId = filter.projectId;
    if (filter?.siteId) where.siteId = filter.siteId;
    if (filter?.status) where.status = filter.status;

    return prisma.materialRequirement.findMany({
      where,
      include: {
        item: {
          include: {
            unit: true,
            balances: true,
          },
        },
        project: true,
        site: true,
        reservations: true,
      },
      orderBy: { requiredDate: "asc" },
    });
  }

  /**
   * คำนวณ Shortage = Required - Available
   * ถ้ามี Shortage > 0 จะระบุปริมาณที่ต้องจัดซื้อเพิ่ม
   */
  static async checkShortage(requirementId: string) {
    const req = await prisma.materialRequirement.findUnique({
      where: { id: requirementId },
      include: {
        item: {
          include: { balances: true, unit: true },
        },
      },
    });

    if (!req) throw new Error("ไม่พบรายการความต้องการใช้วัสดุ");

    const totalAvailable = req.item.balances.reduce((sum, b) => sum + b.availableQuantity, 0);
    const shortage = Math.max(0, req.quantityRequired - totalAvailable);

    return {
      requirementId: req.id,
      itemId: req.itemId,
      itemCode: req.item.code,
      itemName: req.item.name,
      unit: req.item.unit.nameTh,
      quantityRequired: req.quantityRequired,
      totalAvailable,
      shortage,
      needsPurchase: shortage > 0,
    };
  }

  /**
   * จองสต็อก (Reserve Stock) เพื่อป้องกันไม่ให้โครงการอื่นนำไปใช้
   */
  static async reserveStock(params: {
    warehouseId: string;
    itemId: string;
    requirementId?: string;
    projectId?: string;
    workOrderId?: string;
    quantity: number;
    reservedBy: string;
  }) {
    const { warehouseId, itemId, requirementId, projectId, workOrderId, quantity, reservedBy } = params;

    return prisma.$transaction(async (tx) => {
      const balance = await tx.stockBalance.findUnique({
        where: { warehouseId_itemId: { warehouseId, itemId } },
      });

      if (!balance || balance.availableQuantity < quantity) {
        throw new Error("สต็อกที่พร้อมใช้ (Available) ไม่เพียงพอสำหรับการจอง");
      }

      // 1. เพิ่ม reservedQuantity และลด availableQuantity
      await tx.stockBalance.update({
        where: { id: balance.id },
        data: {
          reservedQuantity: balance.reservedQuantity + quantity,
          availableQuantity: balance.availableQuantity - quantity,
        },
      });

      // 2. สร้าง StockReservation
      const reservation = await tx.stockReservation.create({
        data: {
          warehouseId,
          itemId,
          requirementId,
          projectId,
          workOrderId,
          quantity,
          status: "ACTIVE",
          reservedBy,
        },
      });

      return reservation;
    });
  }

  /**
   * ปลดการจองสต็อก (Release Reservation)
   */
  static async releaseReservation(reservationId: string) {
    return prisma.$transaction(async (tx) => {
      const res = await tx.stockReservation.findUnique({
        where: { id: reservationId },
      });

      if (!res || res.status !== "ACTIVE") {
        throw new Error("ไม่พบรายการจองที่ยังคงใช้งานอยู่");
      }

      const balance = await tx.stockBalance.findUnique({
        where: { warehouseId_itemId: { warehouseId: res.warehouseId, itemId: res.itemId } },
      });

      if (balance) {
        await tx.stockBalance.update({
          where: { id: balance.id },
          data: {
            reservedQuantity: Math.max(0, balance.reservedQuantity - res.quantity),
            availableQuantity: balance.availableQuantity + res.quantity,
          },
        });
      }

      return tx.stockReservation.update({
        where: { id: reservationId },
        data: { status: "RELEASED" },
      });
    });
  }
}
