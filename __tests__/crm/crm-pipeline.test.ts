import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { LeadService } from "@/server/services/crm/lead.service";
import { OpportunityService } from "@/server/services/crm/opportunity.service";
import { OpportunityConversionService } from "@/server/services/crm/opportunity-conversion.service";
import { EstimationService } from "@/server/services/crm/estimation.service";
import { EstimationAccuracyService } from "@/server/services/crm/estimation-accuracy.service";

describe("Phase 17: CRM, Pipeline & Conversion Integration Tests", () => {
  let testClient: any;
  let testLead: any;

  beforeEach(async () => {
    // Create test client
    testClient = await prisma.client.create({
      data: {
        code: `CL-TEST-${Date.now().toString().slice(-4)}`,
        name: `Pluak Daeng Hospital Testing ${Date.now()}`,
        status: "ACTIVE",
      },
    });

    testLead = await LeadService.createLead({
      companyName: `Rayong Tech Corp ${Date.now()}`,
      contactName: "Somchai Jaidee",
      phone: "081-999-8888",
      source: "TENDER",
      ownerId: "TEST_SALES",
    });
  });

  it("should convert Lead to Client idempotently", async () => {
    // 1st conversion
    const res1 = await LeadService.convertLeadToClient(testLead.id, "TEST_USER");
    expect(res1.alreadyConverted).toBe(false);
    expect(res1.client.name).toBe(testLead.companyName);

    // 2nd conversion on same lead
    const res2 = await LeadService.convertLeadToClient(testLead.id, "TEST_USER");
    expect(res2.alreadyConverted).toBe(true);
    expect(res2.client.id).toBe(res1.client.id);
  });

  it("should enforce Stage Validation rules on Opportunity", async () => {
    const opp = await OpportunityService.createOpportunity({
      clientId: testClient.id,
      name: "Security Contract 2026",
      ownerId: "TEST_SALES",
      estimatedContractValue: 600000,
    });

    // 1. Trying to jump directly to ESTIMATION without requirements should fail
    await expect(
      OpportunityService.updateStage(opp.id, "ESTIMATION", "TEST_USER")
    ).rejects.toThrow("requires at least one requirement");

    // Add requirement
    await prisma.opportunityRequirement.create({
      data: {
        opportunityId: opp.id,
        type: "WORKFORCE",
        description: "20 Security Guards required",
        priority: "HIGH",
      },
    });

    // Now transitioning to ESTIMATION should succeed
    const estStage = await OpportunityService.updateStage(opp.id, "ESTIMATION", "TEST_USER");
    expect(estStage.stage).toBe("ESTIMATION");

    // 2. Trying to advance to PROPOSAL without approved estimate should fail
    await expect(
      OpportunityService.updateStage(opp.id, "PROPOSAL", "TEST_USER")
    ).rejects.toThrow("requires an APPROVED cost estimate");

    // Create and approve estimate
    const estimate = await EstimationService.createEstimate({
      opportunityId: opp.id,
      createdBy: "TEST_ESTIMATOR",
      workforceRoles: [{ role: "Guard", headcount: 10, workdays: 30, dailyRate: 600 }],
    });
    await EstimationService.approveEstimate(estimate.id, "TEST_APPROVER");

    // Now transitioning to PROPOSAL should succeed
    const propStage = await OpportunityService.updateStage(opp.id, "PROPOSAL", "TEST_USER");
    expect(propStage.stage).toBe("PROPOSAL");
  });

  it("should convert WON Opportunity to Project & Contract idempotently without duplicates", async () => {
    const opp = await OpportunityService.createOpportunity({
      clientId: testClient.id,
      name: "Won Hospital Services Deal",
      ownerId: "TEST_SALES",
      estimatedContractValue: 750000,
    });

    // Mark won
    await OpportunityService.markWon(opp.id, {
      finalValue: 750000,
      performedBy: "TEST_USER",
    });

    // 1st conversion
    const conv1 = await OpportunityConversionService.convertOpportunityToProject({
      opportunityId: opp.id,
      confirmedBy: "COMMERCIAL_DIRECTOR",
    });

    expect(conv1.alreadyConverted).toBe(false);
    expect(conv1.project).toBeDefined();
    expect(conv1.contract).toBeDefined();
    expect(conv1.contract.contractValue).toBe(750000);

    // 2nd conversion call on the same opportunity
    const conv2 = await OpportunityConversionService.convertOpportunityToProject({
      opportunityId: opp.id,
      confirmedBy: "COMMERCIAL_DIRECTOR",
    });

    expect(conv2.alreadyConverted).toBe(true);
    expect(conv2.project.id).toBe(conv1.project.id);
  });

  it("should calculate Estimate vs Actual variance accurately", async () => {
    // Create opportunity and approved estimate
    const opp = await OpportunityService.createOpportunity({
      clientId: testClient.id,
      name: "Operations Project for Variance Testing",
      ownerId: "TEST_SALES",
    });

    const est = await EstimationService.createEstimate({
      opportunityId: opp.id,
      createdBy: "TEST_ESTIMATOR",
      workforceRoles: [{ role: "Security", headcount: 10, workdays: 20, dailyRate: 500 }], // 100,000 labor
      fleetVehicles: [{ vehicleType: "Van", quantity: 1, trips: 10, distanceKmPerTrip: 50, fuelPricePerLiter: 35 }],
    });
    await EstimationService.approveEstimate(est.id, "TEST_APPROVER");

    // Convert to project
    const { project } = await OpportunityConversionService.convertOpportunityToProject({
      opportunityId: opp.id,
      confirmedBy: "TEST_USER",
    });

    // Add actual costs into ProjectCostEntry: Labor 110,000 (10k overrun), Fleet 1,500 (favorable)
    await prisma.projectCostEntry.create({
      data: {
        projectId: project.id,
        costType: "LABOR",
        sourceType: "PAYROLL",
        sourceId: "PAY-TEST-001",
        description: "Actual March Payroll",
        amount: 110000,
        costDate: new Date(),
      },
    });

    const variance = await EstimationAccuracyService.getProjectEstimateVsActual(project.id);
    expect(variance.projectId).toBe(project.id);
    expect(variance.totalActualCost).toBe(110000);
    expect(variance.breakdown.some((b) => b.category === "LABOR" && b.actualCost === 110000)).toBe(true);
  });
});
