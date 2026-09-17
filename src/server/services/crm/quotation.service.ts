import { prisma } from "@/lib/prisma";
import { PricingService } from "./pricing.service";

export interface CreateQuotationDto {
  opportunityId: string;
  clientId: string;
  estimateId?: string;
  validDays?: number; // default 30 days
  discount?: number;
  taxPercent?: number; // default 7%
  commercialAdjustment?: number;
  termsAndConditions?: string;
  createdBy: string;
  customItems?: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }>;
}

export class QuotationService {
  static async getQuotations(filter?: { opportunityId?: string; clientId?: string; status?: string }) {
    const where: any = {};
    if (filter?.opportunityId) where.opportunityId = filter.opportunityId;
    if (filter?.clientId) where.clientId = filter.clientId;
    if (filter?.status) where.status = filter.status;

    return prisma.salesQuotation.findMany({
      where,
      include: {
        opportunity: { select: { id: true, opportunityNo: true, name: true } },
        client: { select: { id: true, name: true, code: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getQuotationById(id: string) {
    return prisma.salesQuotation.findUnique({
      where: { id },
      include: {
        opportunity: { include: { client: true } },
        client: true,
        estimate: { include: { lines: true } },
        items: true,
      },
    });
  }

  static async createQuotation(data: CreateQuotationDto) {
    const opp = await prisma.opportunity.findUnique({ where: { id: data.opportunityId } });
    if (!opp) throw new Error("Opportunity not found");

    const count = await prisma.salesQuotation.count({ where: { opportunityId: data.opportunityId } });
    const version = count + 1;
    const quotationNo = `QUO-${opp.opportunityNo.replace("OPP-", "")}-V${version}`;

    let subtotal = 0;
    const itemsData: Array<{ description: string; quantity: number; unit: string; unitPrice: number; total: number }> = [];

    // If custom items are given, use them
    if (data.customItems && data.customItems.length > 0) {
      for (const it of data.customItems) {
        const itemTotal = Math.round(it.quantity * it.unitPrice);
        subtotal += itemTotal;
        itemsData.push({
          description: it.description,
          quantity: it.quantity,
          unit: it.unit,
          unitPrice: it.unitPrice,
          total: itemTotal,
        });
      }
    } else if (data.estimateId) {
      // Build quotation line items from Estimate
      const estimate = await prisma.opportunityEstimate.findUnique({
        where: { id: data.estimateId },
        include: { lines: true },
      });

      if (estimate) {
        // Group estimate lines by category for professional quotation presentation
        const categoryMap = new Map<string, number>();
        for (const l of estimate.lines) {
          const current = categoryMap.get(l.category) || 0;
          categoryMap.set(l.category, current + l.totalCost);
        }

        // Add proportional margin to categories
        const marginFactor = estimate.suggestedPrice > 0 && estimate.totalEstimatedCost > 0
          ? estimate.suggestedPrice / estimate.totalEstimatedCost
          : 1.2;

        categoryMap.forEach((cost, category) => {
          const quotedPrice = Math.round(cost * marginFactor);
          subtotal += quotedPrice;
          itemsData.push({
            description: `Commercial Scope: ${category} Operations`,
            quantity: 1,
            unit: "lump-sum",
            unitPrice: quotedPrice,
            total: quotedPrice,
          });
        });
      }
    }

    const discount = Math.max(0, data.discount || 0);
    const subtotalAfterDiscount = Math.max(0, subtotal - discount);
    const taxPercent = data.taxPercent ?? 7.0;
    const tax = Math.round(subtotalAfterDiscount * (taxPercent / 100));
    const total = subtotalAfterDiscount + tax;

    const issueDate = new Date();
    const validUntil = new Date();
    validUntil.setDate(issueDate.getDate() + (data.validDays || 30));

    const defaultTC =
      data.termsAndConditions ||
      "1. Price validity: 30 days from date of issue.\n2. Payment terms: 30 days from invoice submission.\n3. Overtime and additional work outside scope will be billed according to agreed master schedule.";

    return prisma.salesQuotation.create({
      data: {
        quotationNo,
        opportunityId: data.opportunityId,
        clientId: data.clientId,
        estimateId: data.estimateId,
        version,
        issueDate,
        validUntil,
        currency: "THB",
        subtotal,
        discount,
        tax,
        total,
        status: "DRAFT",
        termsAndConditions: defaultTC,
        createdBy: data.createdBy,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });
  }

  static async approveQuotation(id: string, approvedBy: string) {
    const quo = await prisma.salesQuotation.findUnique({ where: { id } });
    if (!quo) throw new Error("Quotation not found");

    return prisma.salesQuotation.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  static async sendQuotation(id: string, sentBy?: string) {
    const quo = await prisma.salesQuotation.findUnique({ where: { id } });
    if (!quo) throw new Error("Quotation not found");

    const updated = await prisma.salesQuotation.update({
      where: { id },
      data: { status: "SENT" },
    });

    await prisma.cRMActivity.create({
      data: {
        opportunityId: quo.opportunityId,
        type: "DOCUMENT",
        subject: `Quotation ${quo.quotationNo} Sent to Client`,
        description: `Quotation version ${quo.version} with total ${quo.total.toLocaleString()} THB submitted to client.`,
        scheduledAt: new Date(),
        completedAt: new Date(),
        ownerId: sentBy || quo.createdBy,
        status: "COMPLETED",
      },
    });

    return updated;
  }

  static async reviseQuotation(id: string, createdBy: string, reason: string) {
    const original = await prisma.salesQuotation.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!original) throw new Error("Original quotation not found");

    // Mark previous quotation as REVISED
    await prisma.salesQuotation.update({
      where: { id },
      data: { status: "REVISED" },
    });

    const newVersion = original.version + 1;
    const quotationNo = original.quotationNo.replace(/-V\d+$/, "") + `-V${newVersion}`;

    return prisma.salesQuotation.create({
      data: {
        quotationNo,
        opportunityId: original.opportunityId,
        clientId: original.clientId,
        estimateId: original.estimateId,
        version: newVersion,
        issueDate: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currency: original.currency,
        subtotal: original.subtotal,
        discount: original.discount,
        tax: original.tax,
        total: original.total,
        status: "DRAFT",
        termsAndConditions: original.termsAndConditions,
        revisionReason: reason,
        previousQuotationId: original.id,
        createdBy,
        items: {
          create: original.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unit: it.unit,
            unitPrice: it.unitPrice,
            total: it.total,
          })),
        },
      },
      include: { items: true },
    });
  }

  static async compareQuotations(v1Id: string, v2Id: string) {
    const q1 = await prisma.salesQuotation.findUnique({ where: { id: v1Id }, include: { items: true } });
    const q2 = await prisma.salesQuotation.findUnique({ where: { id: v2Id }, include: { items: true } });

    if (!q1 || !q2) throw new Error("One or both quotations not found");

    const priceDifference = q2.total - q1.total;
    const percentDifference = q1.total > 0 ? ((priceDifference / q1.total) * 100).toFixed(2) : 0;

    return {
      v1: {
        id: q1.id,
        no: q1.quotationNo,
        version: q1.version,
        subtotal: q1.subtotal,
        discount: q1.discount,
        total: q1.total,
        status: q1.status,
      },
      v2: {
        id: q2.id,
        no: q2.quotationNo,
        version: q2.version,
        subtotal: q2.subtotal,
        discount: q2.discount,
        total: q2.total,
        status: q2.status,
        revisionReason: q2.revisionReason,
      },
      variance: {
        priceDifference,
        percentDifference,
      },
    };
  }
}
