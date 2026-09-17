import { prisma } from "@/lib/prisma";
import { StockMovementService } from "./stock-movement.service";

export class MaterialIssueService {
  /**
   * เบิกจ่ายวัสดุเข้าโครงการ / ไซต์งาน / Work Order
   * ตัดสต็อกผ่าน StockMovement Ledger และบันทึก Actual Cost เข้า ProjectCostEntry ของโครงการทันที
   */
  static async issueMaterial(data: {
    warehouseId: string;
    projectId: string;
    siteId?: string;
    workOrderId?: string;
    requestedBy: string;
    issuedBy?: string;
    items: Array<{
      itemId: string;
      requestedQty: number;
      issuedQty: number;
      unitCost?: number;
    }>;
  }) {
    const count = await prisma.materialIssue.count();
    const issueNo = `ISS-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    return prisma.$transaction(async (tx) => {
      // 1. คำนวณต้นทุนต่อชิ้นจาก StockBalance หากไม่ได้ระบุมา
      const itemsWithCost: Array<{
        itemId: string;
        requestedQty: number;
        issuedQty: number;
        unitCost: number;
        totalCost: number;
      }> = [];

      let grandTotalCost = 0;

      for (const it of data.items) {
        const balance = await tx.stockBalance.findUnique({
          where: {
            warehouseId_itemId: { warehouseId: data.warehouseId, itemId: it.itemId },
          },
        });

        if (!balance || balance.availableQuantity < it.issuedQty) {
          throw new Error(
            `สินค้าไม่เพียงพอสำหรับการเบิกจ่าย (คงเหลือ: ${balance?.availableQuantity || 0}, ขอเบิก: ${it.issuedQty})`
          );
        }

        const unitCost = it.unitCost && it.unitCost > 0 ? it.unitCost : balance.averageCost;
        const totalCost = Math.round(it.issuedQty * unitCost * 100) / 100;
        grandTotalCost += totalCost;

        itemsWithCost.push({
          itemId: it.itemId,
          requestedQty: it.requestedQty,
          issuedQty: it.issuedQty,
          unitCost,
          totalCost,
        });
      }

      // 2. สร้าง MaterialIssue
      const issue = await tx.materialIssue.create({
        data: {
          issueNo,
          warehouseId: data.warehouseId,
          projectId: data.projectId,
          siteId: data.siteId,
          workOrderId: data.workOrderId,
          requestedBy: data.requestedBy,
          issuedBy: data.issuedBy,
          status: "ISSUED",
          items: {
            create: itemsWithCost.map((it) => ({
              itemId: it.itemId,
              requestedQty: it.requestedQty,
              issuedQty: it.issuedQty,
              unitCost: it.unitCost,
              totalCost: it.totalCost,
            })),
          },
        },
        include: { items: true },
      });

      // 3. บันทึกตัดสต็อกด้วย StockMovement Ledger สำหรับแต่ละ Item
      for (const it of itemsWithCost) {
        await StockMovementService.recordMovement({
          warehouseId: data.warehouseId,
          itemId: it.itemId,
          movementType: "ISSUE",
          quantity: it.issuedQty,
          unitCost: it.unitCost,
          referenceType: "ISSUE",
          referenceId: issue.id,
          projectId: data.projectId,
          siteId: data.siteId,
          workOrderId: data.workOrderId,
          createdBy: data.issuedBy || data.requestedBy,
        }, tx);
      }

      // 4. บันทึกเข้า ProjectCostEntry (Actual Material Cost)
      await tx.projectCostEntry.create({
        data: {
          projectId: data.projectId,
          siteId: data.siteId,
          costType: "MATERIAL",
          sourceType: "MATERIAL_ISSUE",
          sourceId: issue.id,
          costDate: new Date(),
          amount: grandTotalCost,
          currency: "THB",
          description: `ใบเบิกวัสดุ ${issue.issueNo} เข้าโครงการ`,
          allocationMethod: "DIRECT",
          isCommitted: false,
          status: "POSTED",
          allocatedBy: data.issuedBy || data.requestedBy,
        },
      });

      return issue;
    });
  }

  static async getIssues(filter?: {
    projectId?: string;
    warehouseId?: string;
    siteId?: string;
  }) {
    const where: any = {};
    if (filter?.projectId) where.projectId = filter.projectId;
    if (filter?.warehouseId) where.warehouseId = filter.warehouseId;
    if (filter?.siteId) where.siteId = filter.siteId;

    return prisma.materialIssue.findMany({
      where,
      include: {
        warehouse: true,
        project: true,
        items: true,
      },
      orderBy: { issueDate: "desc" },
    });
  }

  /**
   * คืนวัสดุที่เหลือจากการใช้งานกลับเข้าคลัง (Material Return)
   */
  static async returnMaterial(data: {
    issueId: string;
    warehouseId: string;
    returnedBy: string;
    items: Array<{
      itemId: string;
      returnedQty: number;
      unitCost: number;
    }>;
  }) {
    return prisma.$transaction(async (tx) => {
      const issue = await tx.materialIssue.findUnique({
        where: { id: data.issueId },
      });
      if (!issue) throw new Error("ไม่พบรายการใบเบิกวัสดุ");

      let totalReturnValue = 0;

      for (const it of data.items) {
        if (it.returnedQty <= 0) continue;

        const itemTotalValue = Math.round(it.returnedQty * it.unitCost * 100) / 100;
        totalReturnValue += itemTotalValue;

        await StockMovementService.recordMovement({
          warehouseId: data.warehouseId,
          itemId: it.itemId,
          movementType: "RETURN",
          quantity: it.returnedQty,
          unitCost: it.unitCost,
          referenceType: "ISSUE",
          referenceId: issue.id,
          projectId: issue.projectId,
          siteId: issue.siteId || undefined,
          createdBy: data.returnedBy,
        }, tx);
      }

      // ปรับลด Actual Cost ใน ProjectCostEntry
      if (totalReturnValue > 0) {
        await tx.projectCostEntry.create({
          data: {
            projectId: issue.projectId,
            siteId: issue.siteId,
            costType: "MATERIAL",
            sourceType: "MATERIAL_ISSUE",
            sourceId: `${issue.id}-RET-${Date.now()}`,
            costDate: new Date(),
            amount: -totalReturnValue, // ปรับลดยอดต้นทุน
            currency: "THB",
            description: `ใบคืนวัสดุจากใบเบิก ${issue.issueNo}`,
            allocationMethod: "DIRECT",
            isCommitted: false,
            status: "POSTED",
            allocatedBy: data.returnedBy,
          },
        });
      }

      return { success: true, totalReturnValue };
    });
  }
}
