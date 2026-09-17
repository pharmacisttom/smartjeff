import { prisma } from "@/lib/prisma";

export class PurchaseOrderService {
  static async createPO(data: {
    supplierId: string;
    projectId?: string;
    siteId?: string;
    purchaseRequestId?: string;
    expectedDeliveryDate: Date;
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    createdBy: string;
    items: Array<{
      itemId?: string;
      description: string;
      quantity: number;
      unitName?: string;
      unitPrice: number;
      tax?: number;
      total: number;
    }>;
  }) {
    const poCount = await prisma.purchaseOrder.count();
    const poNo = `PO-${new Date().getFullYear()}-${String(poCount + 1).padStart(4, "0")}`;

    return prisma.purchaseOrder.create({
      data: {
        poNo,
        supplierId: data.supplierId,
        projectId: data.projectId,
        siteId: data.siteId,
        purchaseRequestId: data.purchaseRequestId,
        expectedDeliveryDate: data.expectedDeliveryDate,
        subtotal: data.subtotal,
        discount: data.discount ?? 0,
        tax: data.tax ?? 0,
        total: data.total,
        version: 1,
        status: "PENDING_APPROVAL",
        createdBy: data.createdBy,
        items: {
          create: data.items.map((item) => ({
            itemId: item.itemId,
            description: item.description,
            quantity: item.quantity,
            unitName: item.unitName || "ชิ้น",
            unitPrice: item.unitPrice,
            tax: item.tax ?? 0,
            total: item.total,
            receivedQuantity: 0,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { item: true } },
        project: true,
      },
    });
  }

  static async getPOs(filter?: {
    status?: string;
    supplierId?: string;
    projectId?: string;
  }) {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.supplierId) where.supplierId = filter.supplierId;
    if (filter?.projectId) where.projectId = filter.projectId;

    return prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        project: true,
        items: { include: { item: true } },
        receipts: true,
      },
      orderBy: { orderDate: "desc" },
    });
  }

  static async getPOById(id: string) {
    return prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        project: true,
        items: { include: { item: true } },
        receipts: {
          include: {
            items: true,
            warehouse: true,
          },
        },
        purchaseRequest: true,
      },
    });
  }

  /**
   * อนุมัติใบสั่งซื้อ (PO Approval)
   * เมื่ออนุมัติแล้ว จะผูกภาระผูกพันต้นทุน (Committed Cost) เข้ากับ Project ผ่าน ProjectCostEntry
   */
  static async approvePO(id: string, approvedBy: string) {
    return prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id },
        include: { items: true, project: true },
      });

      if (!po) throw new Error("ไม่พบใบสั่งซื้อที่ระบุ");

      // 1. อัปเดตสถานะ PO
      const updatedPO = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedBy,
          approvedAt: new Date(),
        },
        include: { items: true, supplier: true, project: true },
      });

      // 2. ถ้าผูกกับโครงการ สร้าง/อัปเดต ProjectCostEntry เป็นภาระผูกพัน (isCommitted = true)
      if (po.projectId) {
        await tx.projectCostEntry.upsert({
          where: {
            sourceType_sourceId_projectId_costType: {
              sourceType: "PO",
              sourceId: po.id,
              projectId: po.projectId,
              costType: "MATERIAL",
            },
          },
          update: {
            amount: po.total,
            isCommitted: true,
            status: "POSTED",
            description: `PO ${po.poNo} - ภาระผูกพันจัดซื้อวัสดุ`,
          },
          create: {
            projectId: po.projectId,
            siteId: po.siteId,
            costType: "MATERIAL",
            sourceType: "PO",
            sourceId: po.id,
            costDate: new Date(),
            amount: po.total,
            currency: "THB",
            description: `PO ${po.poNo} - ภาระผูกพันจัดซื้อวัสดุ`,
            allocationMethod: "DIRECT",
            isCommitted: true,
            status: "POSTED",
            allocatedBy: approvedBy,
          },
        });
      }

      return updatedPO;
    });
  }

  /**
   * แก้ไข PO พร้อมบันทึก Version เพื่อไม่ให้เขียนทับประวัติเดิม
   */
  static async revisePO(
    id: string,
    revisionReason: string,
    data: {
      subtotal: number;
      discount?: number;
      tax?: number;
      total: number;
      expectedDeliveryDate?: Date;
    }
  ) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new Error("ไม่พบ PO");

    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        version: po.version + 1,
        revisionReason,
        subtotal: data.subtotal,
        discount: data.discount ?? po.discount,
        tax: data.tax ?? po.tax,
        total: data.total,
        expectedDeliveryDate: data.expectedDeliveryDate ?? po.expectedDeliveryDate,
        status: "PENDING_APPROVAL",
      },
      include: { items: true, supplier: true },
    });
  }
}
