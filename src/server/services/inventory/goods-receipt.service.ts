import { prisma } from "@/lib/prisma";
import { StockMovementService } from "./stock-movement.service";

export class GoodsReceiptService {
  /**
   * ตรวจรับสินค้า (Goods Receipt)
   * บันทึกรายการตรวจรับ แยกจำนวนที่รับ (Accepted) และปฏิเสธ (Rejected)
   * เพิ่มเข้าสต็อกผ่าน StockMovement Ledger สำหรับสินค้าที่ผ่านการตรวจรับ (PASS)
   */
  static async recordGoodsReceipt(data: {
    purchaseOrderId: string;
    warehouseId: string;
    receivedBy: string;
    supplierDeliveryNo?: string;
    items: Array<{
      poItemId: string;
      itemId: string;
      quantityReceived: number;
      quantityAccepted: number;
      quantityRejected?: number;
      qualityStatus?: string;
      unitCost: number;
      notes?: string;
    }>;
  }) {
    const grCount = await prisma.goodsReceipt.count();
    const grNo = `GR-${new Date().getFullYear()}-${String(grCount + 1).padStart(4, "0")}`;

    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: data.purchaseOrderId },
        include: { items: true },
      });

      if (!po) throw new Error("ไม่พบใบสั่งซื้อที่ระบุ");

      // 1. สร้าง Goods Receipt
      const gr = await tx.goodsReceipt.create({
        data: {
          grNo,
          purchaseOrderId: data.purchaseOrderId,
          warehouseId: data.warehouseId,
          receivedBy: data.receivedBy,
          supplierDeliveryNo: data.supplierDeliveryNo,
          status: "COMPLETED",
          items: {
            create: data.items.map((item) => ({
              poItemId: item.poItemId,
              itemId: item.itemId,
              quantityReceived: item.quantityReceived,
              quantityAccepted: item.quantityAccepted,
              quantityRejected: item.quantityRejected ?? 0,
              qualityStatus: item.qualityStatus || "PASS",
              unitCost: item.unitCost,
              notes: item.notes,
            })),
          },
        },
        include: { items: true },
      });

      // 2. ปรับปรุงสต็อกผ่าน StockMovement Ledger สำหรับสินค้าที่ Accepted
      for (const item of data.items) {
        if (item.quantityAccepted > 0) {
          await StockMovementService.recordMovement({
            warehouseId: data.warehouseId,
            itemId: item.itemId,
            movementType: "PURCHASE_RECEIPT",
            quantity: item.quantityAccepted,
            unitCost: item.unitCost,
            referenceType: "GR",
            referenceId: gr.id,
            projectId: po.projectId || undefined,
            siteId: po.siteId || undefined,
            createdBy: data.receivedBy,
          }, tx);
        }

        // 3. ปรับปรุง receivedQuantity ใน PO Item
        await tx.purchaseOrderItem.update({
          where: { id: item.poItemId },
          data: {
            receivedQuantity: { increment: item.quantityAccepted },
          },
        });
      }

      // 4. ตรวจสอบว่ารับสินค้าครบตาม PO หรือยัง
      const updatedPoItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: po.id },
      });

      const allFulfilled = updatedPoItems.every((it) => it.receivedQuantity >= it.quantity);
      const anyReceived = updatedPoItems.some((it) => it.receivedQuantity > 0);

      const newPoStatus = allFulfilled
        ? "RECEIVED"
        : anyReceived
        ? "PARTIALLY_RECEIVED"
        : po.status;

      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: newPoStatus },
      });

      return gr;
    });
  }

  static async getGoodsReceipts(warehouseId?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    return prisma.goodsReceipt.findMany({
      where,
      include: {
        warehouse: true,
        purchaseOrder: {
          include: { supplier: true },
        },
        items: true,
      },
      orderBy: { receivedDate: "desc" },
    });
  }

  static async getGoodsReceiptById(id: string) {
    return prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        warehouse: true,
        purchaseOrder: {
          include: {
            supplier: true,
            project: true,
          },
        },
        items: {
          include: { poItem: true },
        },
      },
    });
  }
}
