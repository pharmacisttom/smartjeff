import { prisma } from "@/lib/prisma";

export interface FiveWhyItem {
  step: number;
  question: string;
  answer: string;
}

export interface FishboneData {
  people?: string[];
  process?: string[];
  machine?: string[];
  material?: string[];
  environment?: string[];
  management?: string[];
}

export interface SaveRCAInput {
  findingId: string;
  method?: string; // FIVE_WHY | FISHBONE | CAUSE_CATEGORY | OTHER
  fiveWhyData?: FiveWhyItem[];
  fishboneData?: FishboneData;
  rootCauseSummary: string;
  reviewedBy: string; // Human Safety / Quality Officer must review
}

export class RCAService {
  /**
   * Saves or updates Root Cause Analysis for a finding
   */
  static async saveRCA(input: SaveRCAInput) {
    if (!input.reviewedBy) {
      throw new Error("RCA Guardrail: A human reviewer is required. Automated personal fault attribution is prohibited.");
    }

    const finding = await prisma.finding.findUnique({ where: { id: input.findingId } });
    if (!finding) throw new Error("Finding not found");

    const method = input.method || "FIVE_WHY";
    const fiveWhyJson = input.fiveWhyData ? JSON.stringify(input.fiveWhyData) : null;
    const fishboneJson = input.fishboneData ? JSON.stringify(input.fishboneData) : null;

    const rca = await prisma.rCAAnalysis.upsert({
      where: { findingId: input.findingId },
      create: {
        findingId: input.findingId,
        method,
        fiveWhyJson,
        fishboneJson,
        rootCauseSummary: input.rootCauseSummary,
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date(),
      },
      update: {
        method,
        fiveWhyJson,
        fishboneJson,
        rootCauseSummary: input.rootCauseSummary,
        reviewedBy: input.reviewedBy,
        reviewedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "RCA_ANALYSIS_SAVED",
        entity: "RCAAnalysis",
        entityId: rca.id,
        metadata: JSON.stringify({
          findingId: input.findingId,
          method,
          reviewedBy: input.reviewedBy,
        }),
      },
    });

    return rca;
  }

  /**
   * Retrieves RCA for a finding
   */
  static async getRCA(findingId: string) {
    return prisma.rCAAnalysis.findUnique({
      where: { findingId },
    });
  }
}
