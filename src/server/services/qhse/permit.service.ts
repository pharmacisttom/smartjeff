import { prisma } from "@/lib/prisma";

export interface CreatePermitInput {
  permitNo: string;
  scope?: string;
  type: string;
  issuer: string;
  issueDate?: Date;
  expiryDate: Date;
  attachmentUrl?: string;
  siteId?: string;
  projectId?: string;
}

export interface PTWControlsChecklist {
  ppe: boolean;
  isolation: boolean;
  fireWatch: boolean;
  gasTest: boolean;
  barricade: boolean;
  rescuePlan: boolean;
}

export interface RequestPTWInput {
  siteId?: string;
  projectId?: string;
  workOrderId?: string;
  type?: string; // HOT_WORK | WORK_AT_HEIGHT | CONFINED_SPACE | ELECTRICAL | EXCAVATION | LIFTING | GENERAL
  requestedBy: string;
  validFrom: Date;
  validTo: Date;
  location: string;
  hazardSummary: string;
  controlsChecklist: PTWControlsChecklist;
}

export class PermitService {
  /**
   * Registers a general permit / license
   */
  static async createPermit(input: CreatePermitInput) {
    const isExpired = input.expiryDate < new Date();

    return prisma.permit.create({
      data: {
        permitNo: input.permitNo,
        scope: input.scope || "SITE",
        type: input.type,
        issuer: input.issuer,
        issueDate: input.issueDate || new Date(),
        expiryDate: input.expiryDate,
        status: isExpired ? "EXPIRED" : "VALID",
        attachmentUrl: input.attachmentUrl,
        siteId: input.siteId,
        projectId: input.projectId,
      },
    });
  }

  /**
   * Retrieves permits with expiry status
   */
  static async getPermits(params: { siteId?: string; projectId?: string; status?: string }) {
    const where: any = {};
    if (params.siteId) where.siteId = params.siteId;
    if (params.projectId) where.projectId = params.projectId;
    if (params.status) where.status = params.status;

    return prisma.permit.findMany({
      where,
      orderBy: { expiryDate: "asc" },
    });
  }

  // -------------------------------------------------------------
  // Permit To Work (PTW) Lightweight Engine
  // -------------------------------------------------------------

  static async generatePTWNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.permitToWork.count();
    return `PTW-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Requests a Permit to Work
   */
  static async requestPTW(input: RequestPTWInput) {
    const ptwNo = await this.generatePTWNo();

    const ptw = await prisma.permitToWork.create({
      data: {
        ptwNo,
        siteId: input.siteId,
        projectId: input.projectId,
        workOrderId: input.workOrderId,
        type: input.type || "GENERAL",
        requestedBy: input.requestedBy,
        requestedAt: new Date(),
        validFrom: input.validFrom,
        validTo: input.validTo,
        location: input.location,
        hazardSummary: input.hazardSummary,
        controlsChecklist: JSON.stringify(input.controlsChecklist),
        status: "PENDING",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "PTW_REQUESTED",
        entity: "PermitToWork",
        entityId: ptw.id,
        metadata: JSON.stringify({ ptwNo: ptw.ptwNo, type: ptw.type, location: ptw.location }),
      },
    });

    return ptw;
  }

  /**
   * Approves Permit to Work (Human Safety Officer must approve)
   */
  static async approvePTW(id: string, approvedBy: string, safetyNotes?: string) {
    const ptw = await prisma.permitToWork.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedBy,
        approvedAt: new Date(),
        safetyOfficerNotes: safetyNotes,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "PTW_APPROVED",
        entity: "PermitToWork",
        entityId: id,
        metadata: JSON.stringify({ ptwNo: ptw.ptwNo, approvedBy }),
      },
    });

    return ptw;
  }

  /**
   * Activates PTW when work commences on site
   */
  static async activatePTW(id: string) {
    return prisma.permitToWork.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
  }

  /**
   * Closes PTW when work completes
   */
  static async closePTW(id: string, closedBy: string) {
    const ptw = await prisma.permitToWork.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedBy,
        closedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "PTW_CLOSED",
        entity: "PermitToWork",
        entityId: id,
        metadata: JSON.stringify({ ptwNo: ptw.ptwNo, closedBy }),
      },
    });

    return ptw;
  }

  /**
   * Retrieves PTWs with filters
   */
  static async getPTWs(params: {
    siteId?: string;
    projectId?: string;
    status?: string;
    type?: string;
  }) {
    const where: any = {};
    if (params.siteId) where.siteId = params.siteId;
    if (params.projectId) where.projectId = params.projectId;
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    return prisma.permitToWork.findMany({
      where,
      orderBy: { requestedAt: "desc" },
    });
  }
}
