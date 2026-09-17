import { prisma } from "@/lib/prisma";

export interface CreateIncidentInput {
  siteId?: string;
  projectId?: string;
  workOrderId?: string;
  reportedBy: string;
  incidentType?: string; // SAFETY | ACCIDENT | NEAR_MISS | QUALITY | ENVIRONMENT | SECURITY | EQUIPMENT | VEHICLE | PROCESS | CLIENT_COMPLAINT | OTHER
  severity?: string; // LOW | MEDIUM | HIGH | CRITICAL
  occurredAt?: Date;
  location: string;
  description: string;
  immediateAction?: string; // STOP_WORK | AREA_ISOLATION | EQUIPMENT_LOCK | MEDICAL_ASSISTANCE | NONE
  assignedTo?: string;
}

export interface IncidentEvidenceInput {
  incidentId: string;
  type?: string;
  fileUrl: string;
  notes?: string;
  uploadedBy: string;
}

export class IncidentService {
  /**
   * Generates sequential incident number e.g. INC-2026-0001
   */
  static async generateIncidentNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.incident.count();
    return `INC-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Reports a new incident. If severity is HIGH or CRITICAL, generates safety recommendations.
   */
  static async createIncident(input: CreateIncidentInput) {
    const incidentNo = await this.generateIncidentNo();
    const severity = input.severity || "MEDIUM";
    const incidentType = input.incidentType || "SAFETY";

    // Immediate action recommendations for high/critical incidents (Human must execute)
    let recommendedImmediateAction = input.immediateAction;
    if (!recommendedImmediateAction && (severity === "HIGH" || severity === "CRITICAL")) {
      if (incidentType === "ACCIDENT" || incidentType === "SAFETY") {
        recommendedImmediateAction = "STOP_WORK";
      } else if (incidentType === "ENVIRONMENT") {
        recommendedImmediateAction = "AREA_ISOLATION";
      } else if (incidentType === "EQUIPMENT" || incidentType === "VEHICLE") {
        recommendedImmediateAction = "EQUIPMENT_LOCK";
      }
    }

    const incident = await prisma.incident.create({
      data: {
        incidentNo,
        siteId: input.siteId,
        projectId: input.projectId,
        workOrderId: input.workOrderId,
        reportedBy: input.reportedBy,
        incidentType,
        severity,
        occurredAt: input.occurredAt || new Date(),
        location: input.location,
        description: input.description,
        immediateAction: recommendedImmediateAction,
        status: "REPORTED",
        assignedTo: input.assignedTo,
      },
    });

    // Immutable audit log
    await prisma.auditLog.create({
      data: {
        action: "INCIDENT_REPORTED",
        entity: "Incident",
        entityId: incident.id,
        metadata: JSON.stringify({
          incidentNo: incident.incidentNo,
          type: incident.incidentType,
          severity: incident.severity,
          immediateAction: incident.immediateAction,
        }),
      },
    });

    return incident;
  }

  /**
   * Add evidence (photo, video reference, document, witness note)
   */
  static async addEvidence(input: IncidentEvidenceInput) {
    const evidence = await prisma.incidentEvidence.create({
      data: {
        incidentId: input.incidentId,
        type: input.type || "PHOTO",
        fileUrl: input.fileUrl,
        notes: input.notes,
        uploadedBy: input.uploadedBy,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "INCIDENT_EVIDENCE_ADDED",
        entity: "IncidentEvidence",
        entityId: evidence.id,
        metadata: JSON.stringify({ incidentId: input.incidentId, type: evidence.type }),
      },
    });

    return evidence;
  }

  /**
   * Updates incident status along lifecycle:
   * REPORTED -> ACKNOWLEDGED -> INVESTIGATING -> ACTION_REQUIRED -> MONITORING -> RESOLVED -> CLOSED
   */
  static async updateStatus(
    id: string,
    status: string,
    performedBy: string,
    notes?: string,
    assignedTo?: string
  ) {
    const current = await prisma.incident.findUnique({ where: { id } });
    if (!current) throw new Error("Incident not found");

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (status === "RESOLVED") updateData.resolvedAt = new Date();
    if (status === "CLOSED") updateData.closedAt = new Date();

    const updated = await prisma.incident.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        action: "INCIDENT_STATUS_UPDATED",
        entity: "Incident",
        entityId: id,
        metadata: JSON.stringify({
          from: current.status,
          to: status,
          performedBy,
          notes,
        }),
      },
    });

    return updated;
  }

  /**
   * Retrieves incidents with optional filters (Near Misses clearly separated)
   */
  static async getIncidents(params: {
    siteId?: string;
    projectId?: string;
    incidentType?: string;
    severity?: string;
    status?: string;
    isNearMissOnly?: boolean;
    take?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (params.siteId) where.siteId = params.siteId;
    if (params.projectId) where.projectId = params.projectId;
    if (params.severity) where.severity = params.severity;
    if (params.status) where.status = params.status;

    if (params.isNearMissOnly) {
      where.incidentType = "NEAR_MISS";
    } else if (params.incidentType) {
      where.incidentType = params.incidentType;
    }

    const [items, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          evidence: true,
          findings: true,
        },
        orderBy: { occurredAt: "desc" },
        take: params.take || 50,
        skip: params.skip || 0,
      }),
      prisma.incident.count({ where }),
    ]);

    return { items, total };
  }

  /**
   * Incident summary metrics (No blame analytics - aggregated by type, severity, site)
   */
  static async getIncidentSummary(siteId?: string) {
    const where = siteId ? { siteId } : {};

    const [total, open, critical, nearMisses, high] = await Promise.all([
      prisma.incident.count({ where }),
      prisma.incident.count({
        where: {
          ...where,
          status: { in: ["REPORTED", "ACKNOWLEDGED", "INVESTIGATING", "ACTION_REQUIRED", "MONITORING"] },
        },
      }),
      prisma.incident.count({
        where: { ...where, severity: "CRITICAL", status: { not: "CLOSED" } },
      }),
      prisma.incident.count({
        where: { ...where, incidentType: "NEAR_MISS" },
      }),
      prisma.incident.count({
        where: { ...where, severity: "HIGH", status: { not: "CLOSED" } },
      }),
    ]);

    return {
      total,
      open,
      critical,
      high,
      nearMisses,
    };
  }
}
