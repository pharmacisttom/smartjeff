import { prisma } from "@/lib/prisma";
import { WorkforceEstimationService, WorkforceRoleInput } from "./workforce-estimation.service";
import { FleetEstimationService, FleetVehicleInput } from "./fleet-estimation.service";
import { MaterialEstimationService, MaterialItemInput } from "./material-estimation.service";

export interface CreateEstimateDto {
  opportunityId: string;
  overheadPercent?: number; // default 10%
  contingencyPercent?: number; // default 5%
  targetMarginPercent?: number; // default 20%
  notes?: string;
  createdBy: string;
  workforceRoles?: WorkforceRoleInput[];
  fleetVehicles?: FleetVehicleInput[];
  materialItems?: MaterialItemInput[];
  additionalLines?: Array<{
    category: string;
    description: string;
    quantity: number;
    unit: string;
    unitCost: number;
    sourceType?: string;
    notes?: string;
  }>;
  assumptions?: Array<{
    key: string;
    label: string;
    value: string;
    unit?: string;
    notes?: string;
  }>;
}

export class EstimationService {
  static async getEstimates(opportunityId: string) {
    return prisma.opportunityEstimate.findMany({
      where: { opportunityId },
      include: { lines: true, assumptions: true, quotations: true },
      orderBy: { version: "desc" },
    });
  }

  static async getEstimateById(id: string) {
    return prisma.opportunityEstimate.findUnique({
      where: { id },
      include: {
        opportunity: { include: { client: true } },
        lines: true,
        assumptions: true,
        quotations: true,
      },
    });
  }

  /**
   * Create Full Estimate with drill-down lines and assumptions
   */
  static async createEstimate(data: CreateEstimateDto) {
    const opp = await prisma.opportunity.findUnique({ where: { id: data.opportunityId } });
    if (!opp) throw new Error("Opportunity not found");

    // Version determination
    const latest = await prisma.opportunityEstimate.findFirst({
      where: { opportunityId: data.opportunityId },
      orderBy: { version: "desc" },
    });
    const version = (latest?.version || 0) + 1;
    const estimateNo = `EST-${opp.opportunityNo.replace("OPP-", "")}-V${version}`;

    // 1. Gather all line items
    const allLines: Array<{
      category: string;
      description: string;
      quantity: number;
      unit: string;
      unitCost: number;
      totalCost: number;
      sourceType?: string;
      sourceReference?: string;
      notes?: string;
    }> = [];

    if (data.workforceRoles && data.workforceRoles.length > 0) {
      const wf = WorkforceEstimationService.calculateWorkforceEstimate(data.workforceRoles);
      allLines.push(...wf.lineItems);
    }

    if (data.fleetVehicles && data.fleetVehicles.length > 0) {
      const fl = FleetEstimationService.calculateFleetEstimate(data.fleetVehicles);
      allLines.push(...fl.lineItems);
    }

    if (data.materialItems && data.materialItems.length > 0) {
      const mt = await MaterialEstimationService.calculateMaterialEstimate(data.materialItems);
      allLines.push(...mt.lineItems);
    }

    if (data.additionalLines && data.additionalLines.length > 0) {
      for (const line of data.additionalLines) {
        allLines.push({
          category: line.category,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitCost: line.unitCost,
          totalCost: Math.round(line.quantity * line.unitCost),
          sourceType: line.sourceType || "MANUAL_ESTIMATE",
          notes: line.notes,
        });
      }
    }

    // Direct Cost = Sum of all lines
    const directCost = allLines.reduce((sum, l) => sum + l.totalCost, 0);

    // Overhead and Contingency
    const overheadPercent = data.overheadPercent ?? 10.0;
    const overheadAmount = Math.round(directCost * (overheadPercent / 100));

    const contingencyPercent = data.contingencyPercent ?? 5.0;
    const contingencyAmount = Math.round(directCost * (contingencyPercent / 100));

    const totalEstimatedCost = directCost + overheadAmount + contingencyAmount;

    // Target Margin & Suggested Price
    const targetMarginPercent = data.targetMarginPercent ?? 20.0;
    // Suggested price based on target gross margin: Price = Cost / (1 - margin%)
    const suggestedPrice =
      targetMarginPercent < 100 && targetMarginPercent > 0
        ? Math.round(totalEstimatedCost / (1 - targetMarginPercent / 100))
        : Math.round(totalEstimatedCost * 1.2);
    const targetMarginAmount = suggestedPrice - totalEstimatedCost;

    const estimate = await prisma.opportunityEstimate.create({
      data: {
        estimateNo,
        opportunityId: data.opportunityId,
        version,
        status: "DRAFT",
        directCost,
        overheadPercent,
        overheadAmount,
        contingencyPercent,
        contingencyAmount,
        totalEstimatedCost,
        targetMarginPercent,
        targetMarginAmount,
        suggestedPrice,
        finalPrice: suggestedPrice,
        currency: "THB",
        createdBy: data.createdBy,
        notes: data.notes,
        lines: {
          create: allLines.map((l) => ({
            category: l.category,
            description: l.description,
            quantity: l.quantity,
            unit: l.unit,
            unitCost: l.unitCost,
            totalCost: l.totalCost,
            sourceType: l.sourceType,
            sourceReference: l.sourceReference,
            notes: l.notes,
          })),
        },
        assumptions: {
          create: (data.assumptions || []).map((a) => ({
            key: a.key,
            label: a.label,
            value: a.value,
            unit: a.unit,
            version,
            notes: a.notes,
          })),
        },
      },
      include: { lines: true, assumptions: true },
    });

    return estimate;
  }

  /**
   * Recalculate Estimate totals and lines
   */
  static async calculateEstimate(estimateId: string) {
    const estimate = await prisma.opportunityEstimate.findUnique({
      where: { id: estimateId },
      include: { lines: true },
    });
    if (!estimate) throw new Error("Estimate not found");

    if (estimate.status === "APPROVED") {
      throw new Error("Cannot recalculate an APPROVED estimate. Please create a new revision.");
    }

    const directCost = estimate.lines.reduce((sum, l) => sum + l.totalCost, 0);
    const overheadAmount = Math.round(directCost * (estimate.overheadPercent / 100));
    const contingencyAmount = Math.round(directCost * (estimate.contingencyPercent / 100));
    const totalEstimatedCost = directCost + overheadAmount + contingencyAmount;

    const suggestedPrice =
      estimate.targetMarginPercent < 100 && estimate.targetMarginPercent > 0
        ? Math.round(totalEstimatedCost / (1 - estimate.targetMarginPercent / 100))
        : Math.round(totalEstimatedCost * 1.2);
    const targetMarginAmount = suggestedPrice - totalEstimatedCost;

    return prisma.opportunityEstimate.update({
      where: { id: estimateId },
      data: {
        directCost,
        overheadAmount,
        contingencyAmount,
        totalEstimatedCost,
        targetMarginAmount,
        suggestedPrice,
        finalPrice: suggestedPrice,
      },
      include: { lines: true, assumptions: true },
    });
  }

  /**
   * Submit estimate for review
   */
  static async submitForReview(estimateId: string) {
    const estimate = await prisma.opportunityEstimate.findUnique({ where: { id: estimateId } });
    if (!estimate) throw new Error("Estimate not found");
    if (estimate.status === "APPROVED") throw new Error("Already approved");

    return prisma.opportunityEstimate.update({
      where: { id: estimateId },
      data: { status: "REVIEW" },
    });
  }

  /**
   * Approve Estimate (Locks estimate against direct edits)
   */
  static async approveEstimate(estimateId: string, approvedBy: string) {
    const estimate = await prisma.opportunityEstimate.findUnique({ where: { id: estimateId } });
    if (!estimate) throw new Error("Estimate not found");

    // Supersede any previous approved estimate for the same opportunity
    await prisma.opportunityEstimate.updateMany({
      where: {
        opportunityId: estimate.opportunityId,
        id: { not: estimateId },
        status: "APPROVED",
      },
      data: { status: "SUPERSEDED" },
    });

    const approved = await prisma.opportunityEstimate.update({
      where: { id: estimateId },
      data: {
        status: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Update opportunity estimatedContractValue if not set or update suggested
    await prisma.opportunity.update({
      where: { id: estimate.opportunityId },
      data: {
        estimatedContractValue: approved.finalPrice || approved.suggestedPrice,
      },
    });

    return approved;
  }

  /**
   * Revise Estimate (Create Version N+1)
   */
  static async reviseEstimate(estimateId: string, createdBy: string, reason?: string) {
    const original = await prisma.opportunityEstimate.findUnique({
      where: { id: estimateId },
      include: { lines: true, assumptions: true },
    });
    if (!original) throw new Error("Original estimate not found");

    const newVersion = original.version + 1;
    const estimateNo = original.estimateNo.replace(/-V\d+$/, "") + `-V${newVersion}`;

    const newEstimate = await prisma.opportunityEstimate.create({
      data: {
        estimateNo,
        opportunityId: original.opportunityId,
        version: newVersion,
        status: "DRAFT",
        directCost: original.directCost,
        overheadPercent: original.overheadPercent,
        overheadAmount: original.overheadAmount,
        contingencyPercent: original.contingencyPercent,
        contingencyAmount: original.contingencyAmount,
        totalEstimatedCost: original.totalEstimatedCost,
        targetMarginPercent: original.targetMarginPercent,
        targetMarginAmount: original.targetMarginAmount,
        suggestedPrice: original.suggestedPrice,
        finalPrice: original.finalPrice,
        currency: original.currency,
        createdBy,
        notes: reason ? `Revision of V${original.version}: ${reason}` : original.notes,
        lines: {
          create: original.lines.map((l) => ({
            category: l.category,
            description: l.description,
            quantity: l.quantity,
            unit: l.unit,
            unitCost: l.unitCost,
            totalCost: l.totalCost,
            sourceType: l.sourceType,
            sourceReference: l.sourceReference,
            notes: l.notes,
          })),
        },
        assumptions: {
          create: original.assumptions.map((a) => ({
            key: a.key,
            label: a.label,
            value: a.value,
            unit: a.unit,
            version: newVersion,
            notes: a.notes,
          })),
        },
      },
      include: { lines: true, assumptions: true },
    });

    return newEstimate;
  }
}
