import { prisma } from "@/lib/prisma";

export class PurchaseRequestService {
  static async createPR(data: {
    requesterId: string;
    projectId?: string;
    siteId?: string;
    workOrderId?: string;
    department?: string;
    requiredDate: Date;
    priority?: string;
    reason: string;
    items: Array<{
      itemId?: string;
      description: string;
      quantity: number;
      unitName?: string;
      estimatedUnitPrice?: number;
    }>;
  }) {
    const prCount = await prisma.purchaseRequest.count();
    const prNo = `PR-${new Date().getFullYear()}-${String(prCount + 1).padStart(4, "0")}`;

    return prisma.purchaseRequest.create({
      data: {
        prNo,
        requesterId: data.requesterId,
        projectId: data.projectId,
        siteId: data.siteId,
        workOrderId: data.workOrderId,
        department: data.department,
        requiredDate: data.requiredDate,
        priority: data.priority || "NORMAL",
        reason: data.reason,
        status: "SUBMITTED",
        items: {
          create: data.items.map((item) => ({
            itemId: item.itemId,
            description: item.description,
            quantity: item.quantity,
            unitName: item.unitName || "ชิ้น",
            estimatedUnitPrice: item.estimatedUnitPrice ?? 0,
            estimatedTotal: Math.round(item.quantity * (item.estimatedUnitPrice ?? 0) * 100) / 100,
          })),
        },
      },
      include: {
        items: { include: { item: true } },
        project: true,
      },
    });
  }

  static async getPRs(filter?: {
    status?: string;
    projectId?: string;
    requesterId?: string;
  }) {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.projectId) where.projectId = filter.projectId;
    if (filter?.requesterId) where.requesterId = filter.requesterId;

    return prisma.purchaseRequest.findMany({
      where,
      include: {
        items: { include: { item: true } },
        project: true,
        orders: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getPRById(id: string) {
    return prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        items: { include: { item: { include: { unit: true } } } },
        project: true,
        orders: { include: { supplier: true } },
        rfqs: { include: { quotations: { include: { supplier: true } } } },
      },
    });
  }

  static async approvePR(id: string, approvedBy: string, status: "APPROVED" | "REJECTED") {
    return prisma.purchaseRequest.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedAt: new Date(),
      },
      include: { items: true, project: true },
    });
  }
}
