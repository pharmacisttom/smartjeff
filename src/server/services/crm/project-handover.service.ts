import { prisma } from "@/lib/prisma";

export class ProjectHandoverService {
  static async getHandoverByProject(projectId: string) {
    return prisma.projectHandover.findFirst({
      where: { projectId },
      include: {
        project: { include: { client: true, contracts: true } },
        opportunity: {
          include: { estimates: true, quotations: true, requirements: true, surveys: true },
        },
      },
    });
  }

  static async updateHandoverChecklist(
    id: string,
    data: {
      signedContractConfirmed?: boolean;
      scopeConfirmed?: boolean;
      siteConfirmed?: boolean;
      workforcePlanConfirmed?: boolean;
      materialPlanConfirmed?: boolean;
      fleetPlanConfirmed?: boolean;
      clientContactConfirmed?: boolean;
      slaConfirmed?: boolean;
      riskConfirmed?: boolean;
      meetingDate?: Date;
      participants?: string;
      notes?: string;
    }
  ) {
    const handover = await prisma.projectHandover.findUnique({ where: { id } });
    if (!handover) throw new Error("Handover not found");

    const updated = await prisma.projectHandover.update({
      where: { id },
      data: {
        ...data,
        meetingDate: data.meetingDate ? new Date(data.meetingDate) : undefined,
      },
    });

    // Check if all items confirmed, set status to READY
    const allConfirmed =
      updated.signedContractConfirmed &&
      updated.scopeConfirmed &&
      updated.siteConfirmed &&
      updated.workforcePlanConfirmed &&
      updated.materialPlanConfirmed &&
      updated.fleetPlanConfirmed &&
      updated.clientContactConfirmed &&
      updated.slaConfirmed &&
      updated.riskConfirmed;

    if (allConfirmed && updated.status === "DRAFT") {
      return prisma.projectHandover.update({
        where: { id },
        data: { status: "READY" },
      });
    }

    return updated;
  }

  static async acceptHandoverByOperations(id: string, acceptedBy: string, notes?: string) {
    const handover = await prisma.projectHandover.findUnique({ where: { id } });
    if (!handover) throw new Error("Handover not found");

    return prisma.projectHandover.update({
      where: { id },
      data: {
        status: "ACCEPTED_BY_OPERATIONS",
        acceptedBy,
        acceptedAt: new Date(),
        notes: notes ? `${handover.notes || ""}\n[Operations Acceptance]: ${notes}` : handover.notes,
      },
    });
  }
}
