import { prisma } from "@/lib/prisma";

export class RFQService {
  static async createRFQ(data: {
    purchaseRequestId?: string;
    issueDate?: Date;
    closingDate: Date;
    supplierIds: string[];
  }) {
    const count = await prisma.requestForQuotation.count();
    const rfqNo = `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    return prisma.requestForQuotation.create({
      data: {
        rfqNo,
        purchaseRequestId: data.purchaseRequestId,
        issueDate: data.issueDate || new Date(),
        closingDate: data.closingDate,
        status: "OPEN",
        suppliers: {
          create: data.supplierIds.map((supplierId) => ({
            supplierId,
          })),
        },
      },
      include: {
        suppliers: { include: { supplier: true } },
        purchaseRequest: { include: { items: true } },
      },
    });
  }

  static async getRFQs() {
    return prisma.requestForQuotation.findMany({
      include: {
        suppliers: { include: { supplier: true } },
        quotations: { include: { supplier: true } },
        purchaseRequest: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getRFQById(id: string) {
    return prisma.requestForQuotation.findUnique({
      where: { id },
      include: {
        suppliers: { include: { supplier: true } },
        quotations: {
          include: {
            supplier: true,
            items: true,
          },
        },
        purchaseRequest: {
          include: { items: { include: { item: true } } },
        },
      },
    });
  }

  static async submitQuotation(data: {
    quotationNo: string;
    supplierId: string;
    rfqId?: string;
    validUntil: Date;
    subtotal: number;
    discount?: number;
    tax?: number;
    total: number;
    leadTimeDays?: number;
    paymentTerms?: string;
    attachmentUrl?: string;
    items: Array<{
      itemId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
      total: number;
    }>;
  }) {
    return prisma.supplierQuotation.create({
      data: {
        quotationNo: data.quotationNo,
        supplierId: data.supplierId,
        rfqId: data.rfqId,
        validUntil: data.validUntil,
        subtotal: data.subtotal,
        discount: data.discount ?? 0,
        tax: data.tax ?? 0,
        total: data.total,
        leadTimeDays: data.leadTimeDays ?? 7,
        paymentTerms: data.paymentTerms,
        attachmentUrl: data.attachmentUrl,
        items: {
          create: data.items.map((item) => ({
            itemId: item.itemId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount ?? 0,
            total: item.total,
          })),
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    });
  }

  /**
   * เปรียบเทียบใบเสนอราคาจาก Suppliers ต่างๆ (Quotation Comparison)
   */
  static async compareQuotations(rfqId: string) {
    const rfq = await prisma.requestForQuotation.findUnique({
      where: { id: rfqId },
      include: {
        quotations: {
          include: {
            supplier: true,
            items: true,
          },
        },
        purchaseRequest: {
          include: { items: true },
        },
      },
    });

    if (!rfq) throw new Error("ไม่พบ RFQ ที่ระบุ");

    const quotations = rfq.quotations.map((q) => ({
      quotationId: q.id,
      quotationNo: q.quotationNo,
      supplierId: q.supplierId,
      supplierName: q.supplier.name,
      supplierCode: q.supplier.code,
      total: q.total,
      leadTimeDays: q.leadTimeDays,
      paymentTerms: q.paymentTerms,
      items: q.items.map((it) => ({
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
      })),
    }));

    return {
      rfqNo: rfq.rfqNo,
      issueDate: rfq.issueDate,
      closingDate: rfq.closingDate,
      quotationCount: quotations.length,
      quotations,
    };
  }
}
