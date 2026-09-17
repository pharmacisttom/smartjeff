import { prisma } from "@/lib/prisma";

export class SupplierService {
  static async getSuppliers(filter?: { status?: string; search?: string }) {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.search) {
      where.OR = [
        { code: { contains: filter.search } },
        { name: { contains: filter.search } },
        { contactName: { contains: filter.search } },
      ];
    }

    return prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: {
            orders: true,
            quotations: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  static async getSupplierById(id: string) {
    return prisma.supplier.findUnique({
      where: { id },
      include: {
        orders: {
          include: {
            receipts: true,
            items: { include: { item: true } },
          },
          orderBy: { orderDate: "desc" },
        },
        quotations: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async createSupplier(data: {
    code: string;
    name: string;
    legalName?: string;
    taxId?: string;
    address?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    paymentTerms?: string;
    status?: string;
  }) {
    return prisma.supplier.create({
      data: {
        code: data.code,
        name: data.name,
        legalName: data.legalName,
        taxId: data.taxId,
        address: data.address,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        paymentTerms: data.paymentTerms || "CREDIT_30",
        status: data.status || "ACTIVE",
      },
    });
  }

  static async updateSupplier(
    id: string,
    data: {
      name?: string;
      legalName?: string;
      taxId?: string;
      address?: string;
      contactName?: string;
      phone?: string;
      email?: string;
      paymentTerms?: string;
      status?: string;
    }
  ) {
    return prisma.supplier.update({
      where: { id },
      data,
    });
  }

  /**
   * คำนวณตัวชี้วัดประสิทธิภาพการส่งมอบของ Supplier (Objective Metrics)
   */
  static async getSupplierDeliveryMetrics(supplierId?: string) {
    const orders = await prisma.purchaseOrder.findMany({
      where: {
        supplierId: supplierId || undefined,
        status: { in: ["RECEIVED", "PARTIALLY_RECEIVED", "CLOSED"] },
      },
      include: {
        receipts: true,
        supplier: true,
      },
    });

    let totalCompletedOrders = 0;
    let onTimeOrders = 0;
    let totalDelayDays = 0;

    for (const po of orders) {
      if (po.receipts.length > 0) {
        totalCompletedOrders++;
        const latestReceipt = po.receipts.reduce((latest, r) =>
          r.receivedDate > latest.receivedDate ? r : latest
        );

        const diffTime = latestReceipt.receivedDate.getTime() - po.expectedDeliveryDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
          onTimeOrders++;
        } else {
          totalDelayDays += diffDays;
        }
      }
    }

    const onTimeRate =
      totalCompletedOrders > 0
        ? Math.round((onTimeOrders / totalCompletedOrders) * 100)
        : 100;
    const avgDelayDays =
      totalCompletedOrders - onTimeOrders > 0
        ? Math.round((totalDelayDays / (totalCompletedOrders - onTimeOrders)) * 10) / 10
        : 0;

    return {
      totalCompletedOrders,
      onTimeOrders,
      onTimeRate,
      avgDelayDays,
    };
  }
}
