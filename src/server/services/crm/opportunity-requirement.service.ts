import { prisma } from "@/lib/prisma";

export interface CreateRequirementDto {
  opportunityId: string;
  type: string; // WORKFORCE | SKILL | SHIFT | SITE | FLEET | MATERIAL | EQUIPMENT | SLA | COMPLIANCE | DOCUMENT | OTHER
  description: string;
  quantity?: number;
  unit?: string;
  priority?: string; // LOW | MEDIUM | HIGH | CRITICAL
  mandatory?: boolean;
  notes?: string;
}

export class OpportunityRequirementService {
  static async getRequirements(opportunityId: string) {
    return prisma.opportunityRequirement.findMany({
      where: { opportunityId },
      orderBy: { priority: "asc" },
    });
  }

  static async addRequirement(data: CreateRequirementDto) {
    return prisma.opportunityRequirement.create({
      data: {
        opportunityId: data.opportunityId,
        type: data.type,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        priority: data.priority || "MEDIUM",
        mandatory: data.mandatory ?? false,
        notes: data.notes,
      },
    });
  }

  static async deleteRequirement(id: string) {
    return prisma.opportunityRequirement.delete({
      where: { id },
    });
  }
}
