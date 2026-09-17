import { prisma } from "@/lib/prisma";

export interface ConvertOpportunityDto {
  opportunityId: string;
  projectManagerId?: string;
  startDate?: Date;
  endDate?: Date;
  confirmedBy: string;
}

export class OpportunityConversionService {
  /**
   * Preview conversion data before committing
   */
  static async getConversionPreview(opportunityId: string) {
    const opp = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: {
        client: true,
        estimates: { where: { status: "APPROVED" }, include: { lines: true } },
        quotations: { where: { status: "ACCEPTED" }, include: { items: true } },
        surveys: true,
        requirements: true,
      },
    });

    if (!opp) throw new Error("Opportunity not found");

    const approvedEstimate = opp.estimates[0] || null;
    const acceptedQuotation = opp.quotations[0] || null;

    const contractValue = opp.finalValue || acceptedQuotation?.total || opp.estimatedContractValue;
    const budgetAmount = approvedEstimate?.totalEstimatedCost || 0;

    return {
      opportunity: {
        id: opp.id,
        opportunityNo: opp.opportunityNo,
        name: opp.name,
        stage: opp.stage,
        alreadyConverted: !!opp.convertedProjectId,
        convertedProjectId: opp.convertedProjectId,
      },
      client: {
        id: opp.client.id,
        code: opp.client.code,
        name: opp.client.name,
      },
      contractValue,
      budgetAmount,
      approvedEstimate: approvedEstimate
        ? {
            id: approvedEstimate.id,
            estimateNo: approvedEstimate.estimateNo,
            directCost: approvedEstimate.directCost,
            totalCost: approvedEstimate.totalEstimatedCost,
            linesCount: approvedEstimate.lines.length,
          }
        : null,
      acceptedQuotation: acceptedQuotation
        ? {
            id: acceptedQuotation.id,
            quotationNo: acceptedQuotation.quotationNo,
            total: acceptedQuotation.total,
          }
        : null,
      surveySites: opp.surveys.map((s) => ({
        temporarySiteName: s.temporarySiteName,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
      })),
      materialRequirementsCount: approvedEstimate?.lines.filter((l) => l.category === "MATERIAL").length || 0,
    };
  }

  /**
   * Convert WON Opportunity to Project, Contract, Site, and Handover (Idempotent)
   */
  static async convertOpportunityToProject(data: ConvertOpportunityDto) {
    const opp = await prisma.opportunity.findUnique({
      where: { id: data.opportunityId },
      include: {
        client: true,
        estimates: { where: { status: "APPROVED" }, include: { lines: true } },
        quotations: { where: { status: { in: ["ACCEPTED", "SENT"] } }, include: { items: true } },
        surveys: true,
        requirements: true,
      },
    });

    if (!opp) throw new Error("Opportunity not found");

    // 1. Idempotency check: if already converted, return existing project
    if (opp.convertedProjectId) {
      const existingProject = await prisma.project.findUnique({
        where: { id: opp.convertedProjectId },
        include: { contracts: true, handovers: true },
      });
      if (existingProject) {
        return {
          project: existingProject,
          alreadyConverted: true,
          message: "Opportunity was already converted to project.",
        };
      }
    }

    const approvedEstimate = opp.estimates[0] || null;
    const acceptedQuotation = opp.quotations.find((q) => q.status === "ACCEPTED") || opp.quotations[0] || null;

    const contractValue = opp.finalValue || acceptedQuotation?.total || opp.estimatedContractValue || 0;
    const budgetAmount = approvedEstimate?.totalEstimatedCost || 0;

    const startDate = data.startDate ? new Date(data.startDate) : opp.expectedStartDate || new Date();
    const endDate = data.endDate ? new Date(data.endDate) : opp.expectedCloseDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

    const projectCount = await prisma.project.count();
    const projectCode = `PRJ-${new Date().getFullYear()}-${String(projectCount + 1).padStart(4, "0")}`;

    // 2. Create Project
    const project = await prisma.project.create({
      data: {
        projectCode,
        clientId: opp.clientId,
        name: opp.name,
        description: opp.description || `Converted from Opportunity ${opp.opportunityNo}`,
        startDate,
        endDate,
        status: "ACTIVE",
        projectManagerId: data.projectManagerId,
        budgetAmount,
        currency: "THB",
        sourceOpportunityId: opp.id,
        sourceEstimateId: approvedEstimate?.id,
        sourceQuotationId: acceptedQuotation?.id,
      },
    });

    // 3. Create Contract
    const contractCount = await prisma.contract.count();
    const contractNo = `CTR-${new Date().getFullYear()}-${String(contractCount + 1).padStart(4, "0")}`;
    const contract = await prisma.contract.create({
      data: {
        contractNo,
        clientId: opp.clientId,
        projectId: project.id,
        name: `Contract: ${opp.name}`,
        contractValue,
        startDate,
        endDate,
        status: "ACTIVE",
      },
    });

    // 4. Create Site if SiteSurvey was completed
    if (opp.surveys.length > 0) {
      for (const survey of opp.surveys) {
        const siteCount = await prisma.site.count();
        const siteCode = `SITE-${String(siteCount + 1).padStart(4, "0")}`;
        await prisma.site.create({
          data: {
            code: siteCode,
            name: survey.temporarySiteName,
            location: survey.address,
            lat: survey.lat,
            lng: survey.lng,
            radius: 200,
          },
        });
      }
    }

    // 5. Seed Material Requirements from Estimate Lines
    if (approvedEstimate && approvedEstimate.lines.length > 0) {
      const materialLines = approvedEstimate.lines.filter((l) => l.category === "MATERIAL");
      for (const mat of materialLines) {
        // Try finding matching item in Item Master
        const item = await prisma.item.findFirst({
          where: { name: { contains: mat.description } },
        });

        if (item) {
          await prisma.materialRequirement.create({
            data: {
              itemId: item.id,
              projectId: project.id,
              quantityRequired: mat.quantity,
              requiredDate: startDate,
              requestedBy: data.confirmedBy,
              status: "REQUESTED",
            },
          });
        }
      }
    }

    // 6. Create Operations Handover record
    const handover = await prisma.projectHandover.create({
      data: {
        projectId: project.id,
        opportunityId: opp.id,
        status: "DRAFT",
        signedContractConfirmed: !!acceptedQuotation,
        scopeConfirmed: true,
        siteConfirmed: opp.surveys.length > 0,
        workforcePlanConfirmed: false,
        materialPlanConfirmed: false,
        fleetPlanConfirmed: false,
        clientContactConfirmed: true,
        slaConfirmed: false,
        riskConfirmed: false,
        notes: `Operations Handover initiated upon conversion of Opportunity ${opp.opportunityNo}. Confirmed by ${data.confirmedBy}.`,
      },
    });

    // 7. Update Opportunity with convertedProjectId and status
    await prisma.opportunity.update({
      where: { id: opp.id },
      data: {
        convertedProjectId: project.id,
        stage: "WON",
        status: "WON",
        wonDate: opp.wonDate || new Date(),
        finalValue: contractValue,
      },
    });

    // 8. Log activity
    await prisma.cRMActivity.create({
      data: {
        opportunityId: opp.id,
        type: "NOTE",
        subject: `Converted to Project ${project.projectCode}`,
        description: `Project ${project.projectCode} and Contract ${contract.contractNo} created with value ${contractValue.toLocaleString()} THB. Operations handover initiated.`,
        scheduledAt: new Date(),
        completedAt: new Date(),
        ownerId: data.confirmedBy,
        status: "COMPLETED",
      },
    });

    return {
      project,
      contract,
      handover,
      alreadyConverted: false,
      message: `Successfully converted Opportunity to Project ${project.projectCode}`,
    };
  }
}
