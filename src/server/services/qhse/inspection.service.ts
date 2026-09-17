import { prisma } from "@/lib/prisma";
import { FindingService } from "./finding.service";

export interface CreateTemplateInput {
  name: string;
  category?: string; // SAFETY | QUALITY | VEHICLE | ASSET | WAREHOUSE | PPE | ENVIRONMENT | HOUSEKEEPING | PROCESS | SUPPLIER
  frequency?: string; // DAILY | WEEKLY | MONTHLY | QUARTERLY | ANNUAL | CUSTOM
  createdBy: string;
  items: Array<{
    orderIndex?: number;
    question: string;
    description?: string;
    responseType?: string; // PASS_FAIL | YES_NO | NUMBER | TEXT | SELECT | PHOTO | SIGNATURE
    required?: boolean;
    weight?: number;
    critical?: boolean;
    optionsJson?: string;
  }>;
}

export interface SubmitInspectionInput {
  templateId: string;
  siteId?: string;
  projectId?: string;
  assetId?: string;
  vehicleId?: string;
  supplierId?: string;
  inspectorId: string;
  scheduledDate?: Date;
  notes?: string;
  signatureUrl?: string;
  items: Array<{
    itemId: string;
    question: string;
    answer: any;
    result: string; // PASS | WARNING | FAIL | NOT_APPLICABLE
    notes?: string;
    photoUrl?: string;
    critical?: boolean;
  }>;
}

export class InspectionService {
  static async generateTemplateNo(): Promise<string> {
    const count = await prisma.inspectionTemplate.count();
    return `TMPL-${String(count + 1).padStart(4, "0")}`;
  }

  static async generateInspectionNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.inspection.count();
    return `INSP-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Creates an inspection template with items
   */
  static async createTemplate(input: CreateTemplateInput) {
    const templateNo = await this.generateTemplateNo();

    const template = await prisma.inspectionTemplate.create({
      data: {
        templateNo,
        name: input.name,
        category: input.category || "SAFETY",
        frequency: input.frequency || "WEEKLY",
        createdBy: input.createdBy,
        items: {
          create: input.items.map((item, idx) => ({
            orderIndex: item.orderIndex || idx + 1,
            question: item.question,
            description: item.description,
            responseType: item.responseType || "PASS_FAIL",
            required: item.required !== false,
            weight: item.weight || 1.0,
            critical: Boolean(item.critical),
            optionsJson: item.optionsJson,
          })),
        },
      },
      include: { items: true },
    });

    return template;
  }

  /**
   * Submits an inspection, evaluates score, detects critical item failures,
   * and automatically raises Critical Findings when needed.
   */
  static async submitInspection(input: SubmitInspectionInput) {
    const inspectionNo = await this.generateInspectionNo();

    // Fetch template items to get weights and critical markers
    const template = await prisma.inspectionTemplate.findUnique({
      where: { id: input.templateId },
      include: { items: true },
    });
    if (!template) throw new Error("Inspection template not found");

    let totalWeight = 0;
    let earnedWeight = 0;
    let hasCriticalFailure = false;
    let criticalFailures: any[] = [];

    for (const item of input.items) {
      const tmplItem = template.items.find((ti) => ti.id === item.itemId);
      const weight = tmplItem?.weight || 1.0;
      const isCritical = tmplItem?.critical || Boolean(item.critical);

      if (item.result === "NOT_APPLICABLE") continue;

      totalWeight += weight;
      if (item.result === "PASS") {
        earnedWeight += weight;
      } else if (item.result === "WARNING") {
        earnedWeight += weight * 0.5;
      } else if (item.result === "FAIL") {
        if (isCritical) {
          hasCriticalFailure = true;
          criticalFailures.push({ ...item, question: tmplItem?.question || item.question });
        }
      }
    }

    const calculatedScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 100;
    let finalResult = "PASS";
    if (hasCriticalFailure || calculatedScore < 60) {
      finalResult = "FAIL";
    } else if (calculatedScore < 85) {
      finalResult = "WARNING";
    }

    const inspection = await prisma.inspection.create({
      data: {
        inspectionNo,
        templateId: input.templateId,
        siteId: input.siteId,
        projectId: input.projectId,
        assetId: input.assetId,
        vehicleId: input.vehicleId,
        supplierId: input.supplierId,
        inspectorId: input.inspectorId,
        scheduledDate: input.scheduledDate || new Date(),
        completedDate: new Date(),
        result: finalResult,
        score: Math.round(calculatedScore * 10) / 10,
        itemsJson: JSON.stringify(input.items),
        notes: input.notes,
        signatureUrl: input.signatureUrl,
        status: "COMPLETED",
      },
    });

    // If critical failure occurred, automatically generate Critical Findings
    if (hasCriticalFailure && criticalFailures.length > 0) {
      for (const cf of criticalFailures) {
        await FindingService.createFinding({
          title: `[Critical Inspection Failure] ${cf.question}`,
          description: `Critical inspection item failed during ${inspection.inspectionNo}: ${cf.notes || "Immediate corrective action required."}`,
          source: "INSPECTION",
          sourceId: inspection.id,
          inspectionId: inspection.id,
          classification: "CRITICAL",
          siteId: input.siteId,
          projectId: input.projectId,
          ownerId: input.inspectorId,
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours for critical
          priority: "URGENT",
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        action: "INSPECTION_COMPLETED",
        entity: "Inspection",
        entityId: inspection.id,
        metadata: JSON.stringify({
          inspectionNo: inspection.inspectionNo,
          result: inspection.result,
          score: inspection.score,
          criticalFailures: criticalFailures.length,
        }),
      },
    });

    return inspection;
  }

  /**
   * Retrieves inspection templates
   */
  static async getTemplates(category?: string) {
    const where: any = { isActive: true };
    if (category) where.category = category;
    return prisma.inspectionTemplate.findMany({
      where,
      include: { items: { orderBy: { orderIndex: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Retrieves inspections with filters
   */
  static async getInspections(params: {
    siteId?: string;
    projectId?: string;
    templateId?: string;
    result?: string;
    take?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (params.siteId) where.siteId = params.siteId;
    if (params.projectId) where.projectId = params.projectId;
    if (params.templateId) where.templateId = params.templateId;
    if (params.result) where.result = params.result;

    const [items, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        include: {
          template: true,
          findings: true,
        },
        orderBy: { completedDate: "desc" },
        take: params.take || 50,
        skip: params.skip || 0,
      }),
      prisma.inspection.count({ where }),
    ]);

    return { items, total };
  }
}
