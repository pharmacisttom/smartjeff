import { prisma } from "@/lib/prisma";

export interface RecordMovementParams {
  warehouseId: string;
  itemId: string;
  movementType:
    | "PURCHASE_RECEIPT"
    | "ISSUE"
    | "RETURN"
    | "TRANSFER_IN"
    | "TRANSFER_OUT"
    | "ADJUSTMENT_IN"
    | "ADJUSTMENT_OUT"
    | "CONSUMPTION"
    | "DAMAGED"
    | "LOST";
  quantity: number;
  unitCost?: number;
  referenceType: "PO" | "GR" | "ISSUE" | "TRANSFER" | "ADJUSTMENT" | "WORK_ORDER" | "MANUAL";
  referenceId: string;
  projectId?: string;
  siteId?: string;
  workOrderId?: string;
  createdBy: string;
}

export class StockMovementService {
  /**
   * บันทึกการเคลื่อนไหวสต็อก (Stock Movement Ledger)
   * คำนวณ Weighted Average Cost เมื่อมีสินค้าเข้า และป้องกัน Negative Stock เมื่อมีสินค้าออก
   */
  static async recordMovement(params: RecordMovementParams, txClient?: any) {
    const {
      warehouseId,
      itemId,
      movementType,
      quantity,
      unitCost = 0,
      referenceType,
      referenceId,
      projectId,
      siteId,
      workOrderId,
      createdBy,
    } = params;

    if (quantity <= 0) {
      throw new Error("ปริมาณสินค้าสำหรับการเคลื่อนไหวต้องมากกว่า 0");
    }

    // กำหนดว่า movement เป็นแบบเพิ่มสต็อก (+) หรือลดสต็อก (-)
    const isIncoming = [
      "PURCHASE_RECEIPT",
      "RETURN",
      "TRANSFER_IN",
      "ADJUSTMENT_IN",
    ].includes(movementType);

    const isOutgoing = [
      "ISSUE",
      "TRANSFER_OUT",
      "ADJUSTMENT_OUT",
      "CONSUMPTION",
      "DAMAGED",
      "LOST",
    ].includes(movementType);

    const executeOperation = async (tx: any) => {
      // 1. ดึงข้อมูล StockBalance ปัจจุบัน
      let balance = await tx.stockBalance.findUnique({
        where: {
          warehouseId_itemId: { warehouseId, itemId },
        },
      });

      // ดึง Item เพื่อทราบ standardCost หาก unitCost ไม่ได้ระบุ
      const item = await tx.item.findUnique({
        where: { id: itemId },
      });
      if (!item) {
        throw new Error(`ไม่พบสินค้ารหัส ${itemId}`);
      }

      const effectiveUnitCost = unitCost > 0 ? unitCost : (balance?.averageCost || item.standardCost);
      const totalCost = Math.round(quantity * effectiveUnitCost * 100) / 100;

      if (!balance) {
        balance = await tx.stockBalance.create({
          data: {
            warehouseId,
            itemId,
            quantity: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            averageCost: effectiveUnitCost,
          },
        });
      }

      let newQuantity = balance.quantity;
      let newAverageCost = balance.averageCost;

      if (isIncoming) {
        // เพิ่มสต็อก & คำนวณ Weighted Average Cost
        const oldTotalValue = balance.quantity * balance.averageCost;
        const incomingValue = quantity * effectiveUnitCost;
        newQuantity = balance.quantity + quantity;

        if (newQuantity > 0) {
          newAverageCost = Math.round(((oldTotalValue + incomingValue) / newQuantity) * 100) / 100;
        }
      } else if (isOutgoing) {
        // ตรวจสอบ Negative Stock Guard
        if (balance.availableQuantity < quantity) {
          throw new Error(
            `ยอดสต็อกคงเหลือไม่เพียงพอ (สต็อกที่มี: ${balance.availableQuantity}, ต้องการตัด: ${quantity}) เพื่อความปลอดภัยห้ามติดลบ`
          );
        }
        newQuantity = balance.quantity - quantity;
      }

      const newAvailable = Math.max(0, newQuantity - balance.reservedQuantity);

      // 2. อัปเดต StockBalance
      await tx.stockBalance.update({
        where: { id: balance.id },
        data: {
          quantity: newQuantity,
          availableQuantity: newAvailable,
          averageCost: newAverageCost,
        },
      });

      // 3. บันทึก StockMovement Ledger
      const movement = await tx.stockMovement.create({
        data: {
          warehouseId,
          itemId,
          movementType,
          quantity,
          unitCost: effectiveUnitCost,
          totalCost,
          referenceType,
          referenceId,
          projectId,
          siteId,
          workOrderId,
          createdBy,
        },
      });

      return movement;
    };

    if (txClient) {
      return executeOperation(txClient);
    }
    return prisma.$transaction(executeOperation);
  }

  static async getStockMovements(filter?: {
    warehouseId?: string;
    itemId?: string;
    movementType?: string;
    projectId?: string;
    limit?: number;
  }) {
    const where: any = {};
    if (filter?.warehouseId) where.warehouseId = filter.warehouseId;
    if (filter?.itemId) where.itemId = filter.itemId;
    if (filter?.movementType) where.movementType = filter.movementType;
    if (filter?.projectId) where.projectId = filter.projectId;

    return prisma.stockMovement.findMany({
      where,
      include: {
        warehouse: true,
        item: { include: { unit: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
      take: filter?.limit || 50,
    });
  }

  static async getStockBalances(warehouseId?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    return prisma.stockBalance.findMany({
      where,
      include: {
        warehouse: true,
        item: { include: { unit: true, category: true } },
      },
      orderBy: { item: { code: "asc" } },
    });
  }

  static async getInventorySummary() {
    const balances = await prisma.stockBalance.findMany({
      include: { item: true },
    });

    const totalSKUs = new Set(balances.map((b) => b.itemId)).size;
    const totalQuantity = balances.reduce((sum, b) => sum + b.quantity, 0);
    const totalInventoryValue = Math.round(
      balances.reduce((sum, b) => sum + b.quantity * b.averageCost, 0) * 100
    ) / 100;

    const lowStockItems = balances.filter(
      (b) => b.availableQuantity > 0 && b.availableQuantity <= b.item.reorderPoint
    );
    const outOfStockItems = balances.filter((b) => b.availableQuantity <= 0);

    return {
      totalSKUs,
      totalQuantity,
      totalInventoryValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
    };
  }
}
