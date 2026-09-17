import { prisma } from "@/lib/prisma";
import { StockMovementService } from "./stock-movement.service";

export interface StockCountItemResult {
  itemId: string;
  itemCode?: string;
  itemName?: string;
  systemQty: number;
  countedQty: number;
  variance: number;
  averageCost: number;
}

export class StockCountService {
  static async createStockCount(data: {
    warehouseId: string;
    countType?: "FULL" | "CYCLE";
    countedBy: string;
    notes?: string;
    results: StockCountItemResult[];
  }) {
    const count = await prisma.stockCount.count();
    const countNo = `SC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    // คำนวณ Variance สำหรับทุกรายการ
    const processedResults = data.results.map((r) => ({
      ...r,
      variance: Math.round((r.countedQty - r.systemQty) * 100) / 100,
    }));

    return prisma.stockCount.create({
      data: {
        countNo,
        warehouseId: data.warehouseId,
        countType: data.countType || "CYCLE",
        countedBy: data.countedBy,
        notes: data.notes,
        status: "PENDING_REVIEW",
        results: JSON.stringify(processedResults),
      },
      include: { warehouse: true },
    });
  }

  static async getStockCounts(warehouseId?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    return prisma.stockCount.findMany({
      where,
      include: { warehouse: true },
      orderBy: { countedDate: "desc" },
    });
  }

  /**
   * อนุมัติการปรับยอดสต็อกตามผลการตรวจนับ (Approve Stock Adjustment)
   * สร้าง StockMovement ชนิด ADJUSTMENT_IN หรือ ADJUSTMENT_OUT
   */
  static async applyAdjustment(countId: string, approvedBy: string) {
    return prisma.$transaction(async (tx) => {
      const stockCount = await tx.stockCount.findUnique({
        where: { id: countId },
      });

      if (!stockCount || stockCount.status !== "PENDING_REVIEW") {
        throw new Error("ใบตรวจนับไม่อยู่ในสถานะรออนุมัติ");
      }

      const results: StockCountItemResult[] = JSON.parse(stockCount.results);

      for (const item of results) {
        if (item.variance === 0) continue;

        if (item.variance > 0) {
          // สต็อกจริงมากกว่าระบบ -> ปรับเข้า (ADJUSTMENT_IN)
          await StockMovementService.recordMovement({
            warehouseId: stockCount.warehouseId,
            itemId: item.itemId,
            movementType: "ADJUSTMENT_IN",
            quantity: item.variance,
            unitCost: item.averageCost,
            referenceType: "ADJUSTMENT",
            referenceId: stockCount.id,
            createdBy: approvedBy,
          }, tx);
        } else {
          // สต็อกจริงน้อยกว่าระบบ -> ปรับออก (ADJUSTMENT_OUT)
          const qtyToDeduct = Math.abs(item.variance);
          await StockMovementService.recordMovement({
            warehouseId: stockCount.warehouseId,
            itemId: item.itemId,
            movementType: "ADJUSTMENT_OUT",
            quantity: qtyToDeduct,
            unitCost: item.averageCost,
            referenceType: "ADJUSTMENT",
            referenceId: stockCount.id,
            createdBy: approvedBy,
          }, tx);
        }
      }

      return tx.stockCount.update({
        where: { id: countId },
        data: { status: "ADJUSTED" },
        include: { warehouse: true },
      });
    });
  }
}
