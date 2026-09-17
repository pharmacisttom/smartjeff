import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export interface CreateObservationInput {
  siteId?: string;
  type?: string; // UNSAFE_CONDITION | UNSAFE_ACT | GOOD_PRACTICE | NEAR_MISS | ENVIRONMENTAL_CONCERN
  category?: string; // PPE | HOUSEKEEPING | ELECTRICAL | WORKING_AT_HEIGHT | CHEMICAL | SPILL | DUST | NOISE | OTHER
  location: string;
  description: string;
  photoUrl?: string;
  isAnonymous?: boolean;
  reporterId?: string;
}

export class SafetyObservationService {
  /**
   * Generates sequential observation number e.g. OBS-2026-0001
   */
  static async generateObservationNo(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.safetyObservation.count();
    return `OBS-${year}-${String(count + 1).padStart(4, "0")}`;
  }

  /**
   * Submits a safety observation (supports anonymous-to-management with secure token)
   */
  static async createObservation(input: CreateObservationInput) {
    const observationNo = await this.generateObservationNo();
    let reporterToken: string | null = null;
    let actualReporterId: string | null = input.reporterId || null;

    if (input.isAnonymous) {
      // In anonymous mode, prevent storage of reporter identity while retaining an audit hash token
      reporterToken = `ANON-${crypto.randomBytes(8).toString("hex")}`;
      actualReporterId = null;
    }

    const observation = await prisma.safetyObservation.create({
      data: {
        observationNo,
        siteId: input.siteId,
        type: input.type || "UNSAFE_CONDITION",
        category: input.category || "GENERAL",
        location: input.location,
        description: input.description,
        photoUrl: input.photoUrl,
        isAnonymous: Boolean(input.isAnonymous),
        reporterId: actualReporterId,
        reporterToken,
        status: "SUBMITTED",
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "SAFETY_OBSERVATION_SUBMITTED",
        entity: "SafetyObservation",
        entityId: observation.id,
        metadata: JSON.stringify({
          observationNo: observation.observationNo,
          type: observation.type,
          category: observation.category,
          isAnonymous: observation.isAnonymous,
        }),
      },
    });

    return observation;
  }

  /**
   * Batch sync for mobile offline mode
   */
  static async syncOfflineObservations(items: CreateObservationInput[]) {
    const results = [];
    for (const item of items) {
      const created = await this.createObservation(item);
      results.push(created);
    }
    return { syncedCount: results.length, items: results };
  }

  /**
   * Reviews an observation and transitions status: SUBMITTED -> REVIEWED -> ACTION_TAKEN -> CLOSED
   */
  static async reviewObservation(id: string, reviewerId: string, status: string = "REVIEWED") {
    const observation = await prisma.safetyObservation.update({
      where: { id },
      data: {
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    });

    return observation;
  }

  /**
   * Retrieves observations with filtering
   */
  static async getObservations(params: {
    siteId?: string;
    type?: string;
    category?: string;
    status?: string;
    take?: number;
    skip?: number;
  }) {
    const where: any = {};
    if (params.siteId) where.siteId = params.siteId;
    if (params.type) where.type = params.type;
    if (params.category) where.category = params.category;
    if (params.status) where.status = params.status;

    const [items, total] = await Promise.all([
      prisma.safetyObservation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: params.take || 50,
        skip: params.skip || 0,
      }),
      prisma.safetyObservation.count({ where }),
    ]);

    return { items, total };
  }
}
