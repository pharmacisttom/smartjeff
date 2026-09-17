import { prisma } from "@/lib/prisma";
import { FindingService } from "./finding.service";

export interface CreateAuditProgramInput {
  year: number;
  title: string;
  description?: string;
}

export interface ScheduleAuditInput {
  programId?: string;
  type?: string; // INTERNAL | CLIENT | SUPPLIER | SITE | PROJECT | QUALITY | SAFETY | COMPLIANCE
  scope: string;
  leadAuditorId: string;
  siteId?: string;
  projectId?: string;
  supplierId?: string;
  scheduledDate: Date;
}

export interface AuditChecklistItem {
  item: string;
  requirement: string;
  result: "COMPLIANT" | "MINOR_NC" | "MAJOR_NC" | "OBSERVATION" | "NOT_APPLICABLE";
  notes?: string;
}

export class AuditService {
  static async createProgram(input: CreateAuditProgramInput) {
    const count = await prisma.auditProgram.count();
    const programNo = `AUD-PROG-${input.year}-${String(count + 1).padStart(2, "0")}`;

    return prisma.auditProgram.create({
      data: {
        programNo,
        year: input.year,
        title: input.title,
        description: input.description,
        status: "ACTIVE",
      },
    });
  }

  static async scheduleAudit(input: ScheduleAuditInput) {
    const year = new Date().getFullYear();
    const count = await prisma.audit.count();
    const auditNo = `AUD-${year}-${String(count + 1).padStart(4, "0")}`;

    return prisma.audit.create({
      data: {
        auditNo,
        programId: input.programId,
        type: input.type || "INTERNAL",
        scope: input.scope,
        leadAuditorId: input.leadAuditorId,
        siteId: input.siteId,
        projectId: input.projectId,
        supplierId: input.supplierId,
        scheduledDate: input.scheduledDate,
        status: "PLANNED",
      },
    });
  }

  /**
   * Records checklist results, and automatically raises Findings for Non-Conformances
   */
  static async recordChecklistResults(auditId: string, items: AuditChecklistItem[]) {
    const audit = await prisma.audit.findUnique({ where: { id: auditId } });
    if (!audit) throw new Error("Audit not found");

    const createdItems = [];
    for (const item of items) {
      const checklist = await prisma.auditChecklist.create({
        data: {
          auditId,
          item: item.item,
          requirement: item.requirement,
          result: item.result,
          notes: item.notes,
        },
      });
      createdItems.push(checklist);

      // If Minor NC or Major NC, create finding
      if (item.result === "MINOR_NC" || item.result === "MAJOR_NC") {
        await FindingService.createFinding({
          title: `[Audit NC] ${item.item}`,
          description: `Non-conformance detected during audit ${audit.auditNo}: ${item.notes || item.requirement}`,
          source: "AUDIT",
          sourceId: audit.id,
          classification: item.result === "MAJOR_NC" ? "MAJOR" : "MINOR",
          siteId: audit.siteId || undefined,
          projectId: audit.projectId || undefined,
          ownerId: audit.leadAuditorId,
          dueDate: new Date(Date.now() + (item.result === "MAJOR_NC" ? 7 : 14) * 24 * 60 * 60 * 1000),
          priority: item.result === "MAJOR_NC" ? "HIGH" : "MEDIUM",
        });
      }
    }

    // Transition audit to REPORTING or FOLLOW_UP
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: "REPORTING",
        actualDate: new Date(),
        updatedAt: new Date(),
      },
    });

    return createdItems;
  }

  /**
   * Retrieves audits with filters
   */
  static async getAudits(params: {
    type?: string;
    status?: string;
    siteId?: string;
    projectId?: string;
  }) {
    const where: any = {};
    if (params.type) where.type = params.type;
    if (params.status) where.status = params.status;
    if (params.siteId) where.siteId = params.siteId;
    if (params.projectId) where.projectId = params.projectId;

    return prisma.audit.findMany({
      where,
      include: {
        program: true,
        checklists: true,
      },
      orderBy: { scheduledDate: "desc" },
    });
  }

  /**
   * Audit summary KPI
   */
  static async getAuditSummary() {
    const [total, planned, inProgress, reporting, followUp, closed] = await Promise.all([
      prisma.audit.count(),
      prisma.audit.count({ where: { status: "PLANNED" } }),
      prisma.audit.count({ where: { status: "IN_PROGRESS" } }),
      prisma.audit.count({ where: { status: "REPORTING" } }),
      prisma.audit.count({ where: { status: "FOLLOW_UP" } }),
      prisma.audit.count({ where: { status: "CLOSED" } }),
    ]);

    return { total, planned, inProgress, reporting, followUp, closed };
  }
}
