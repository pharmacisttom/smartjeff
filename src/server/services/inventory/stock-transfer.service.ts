import { prisma } from "@/lib/prisma";
import { StockMovementService } from "./stock-movement.service";

export class StockTransferService {
  /**
   * เริ่มต้นการโอนย้ายสินค้าระหว่างคลัง (Initiate Stock Transfer)
   * ตัดสต็อกออกจากคลังต้นทางทันที และระบุสถานะเป็น IN_TRANSIT
   */
  static async initiateTransfer(data: {
    fromWarehouseId: string;
    toWarehouseId: string;
    initiatedBy: string;
    items: Array<{
      itemId: string;
      quantity: number;
      unitCost?: number;
    }>;
  }) {
    if (data.fromWarehouseId === data.toWarehouseId) {
      throw new Error("คลังต้นทางและคลังปลายทางต้องไม่เป็นคลังเดียวกัน");
    }

    const count = await prisma.stockTransfer.count();
    const transferNo = `TRF-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    return prisma.$transaction(async (tx) => {
      // 1. ตรวจสอบและดึงต้นทุนสินค้า
      const transferItems: Array<{ itemId: string; quantity: number; unitCost: number }> = [];

      for (const it of data.items) {
        const balance = await tx.stockBalance.findUnique({
          where: {
            warehouseId_itemId: { warehouseId: data.fromWarehouseId, itemId: it.itemId },
          },
        });

        if (!balance || balance.availableQuantity < it.quantity) {
          throw new Error(`สินค้าในคลังต้นทางไม่เพียงพอสำหรับการโอนย้าย (ต้องการ: ${it.quantity})`);
        }

        const unitCost = it.unitCost && it.unitCost > 0 ? it.unitCost : balance.averageCost;
        transferItems.push({
          itemId: it.itemId,
          quantity: it.quantity,
          unitCost,
        });
      }

      // 2. สร้าง StockTransfer
      const transfer = await tx.stockTransfer.create({
        data: {
          transferNo,
          fromWarehouseId: data.fromWarehouseId,
          toWarehouseId: data.toWarehouseId,
          status: "IN_TRANSIT",
          initiatedBy: data.initiatedBy,
          items: JSON.stringify(transferItems),
        },
      });

      // 3. ตัดสต็อกออกจากคลังต้นทาง
      for (const it of transferItems) {
        await StockMovementService.recordMovement({
          warehouseId: data.fromWarehouseId,
          itemId: it.itemId,
          movementType: "TRANSFER_OUT",
          quantity: it.quantity,
          unitCost: it.unitCost,
          referenceType: "TRANSFER",
          referenceId: transfer.id,
          createdBy: data.initiatedBy,
        }, tx);
      }

      return transfer;
    });
  }

  /**
   * รับสินค้าจากการโอนย้ายเข้าคลังปลายทาง (Receive Stock Transfer)
   * เพิ่มสต็อกเข้าคลังปลายทาง และปรับสถานะเป็น RECEIVED
   */
  static async receiveTransfer(transferId: string, receivedBy: string) {
    return prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId },
      });

      if (!transfer || transfer.status !== "IN_TRANSIT") {
        throw new Error("รายการโอนย้ายไม่อยู่ในสถานะที่สามารถรับสินค้าได้");
      }

      const items: Array<{ itemId: string; quantity: number; unitCost: number }> = JSON.parse(
        transfer.items
      );

      // 1. เพิ่มสต็อกเข้าคลังปลายทางผ่าน StockMovement Ledger
      for (const it of items) {
        await StockMovementService.recordMovement({
          warehouseId: transfer.toWarehouseId,
          itemId: it.itemId,
          movementType: "TRANSFER_IN",
          quantity: it.quantity,
          unitCost: it.unitCost,
          referenceType: "TRANSFER",
          referenceId: transfer.id,
          createdBy: receivedBy,
        }, tx);
      }

      // 2. อัปเดตสถานะการโอนย้าย
      return tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status: "RECEIVED",
          receivedBy,
          receivedDate: new Date(),
        },
        include: { fromWarehouse: true, toWarehouse: true },
      });
    });
  }

  static async getTransfers(warehouseId?: string) {
    const where: any = {};
    if (warehouseId) {
      where.OR = [{ fromWarehouseId: warehouseId }, { toWarehouseId: warehouseId }];
    }

    return prisma.stockTransfer.findMany({
      where,
      include: {
        fromWarehouse: true,
        toWarehouse: true,
      },
      orderBy: { transferDate: "desc" },
    });
  }
}
