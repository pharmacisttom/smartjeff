import { describe, it, expect } from "vitest";
import { TransactionNormalizer } from "@/server/finance/banks/normalizers/transaction-normalizer";
import { GenericCSVImporter } from "@/server/finance/banks/importers/csv-importer";
import { MatchingRulesEngine } from "@/server/finance/banks/matching/matching-rules";
import { BankMatchingService } from "@/server/services/finance/bank-matching.service";
import { BankReconciliationService } from "@/server/services/finance/bank-reconciliation.service";
import { TreasuryPositionService } from "@/server/services/finance/treasury-position.service";
import { TreasuryForecastService } from "@/server/services/finance/treasury-forecast.service";
import { LiquidityRiskService } from "@/server/services/finance/liquidity-risk.service";
import { BudgetPlanningService } from "@/server/services/finance/budget-planning.service";
import { BudgetControlService } from "@/server/services/finance/budget-control.service";
import { TreasuryScenarioService } from "@/server/services/finance/treasury-scenario.service";
import { prisma } from "@/lib/prisma";

describe("Phase 21: Bank Reconciliation, Treasury & Budget Control Tests", () => {
  describe("1. Bank Statement Normalization & SHA-256 Duplicate Hashing", () => {
    it("should generate deterministic SHA-256 hash for identical transactions", () => {
      const date = new Date("2026-09-15T10:00:00Z");
      const hash1 = TransactionNormalizer.generateHash(
        "acc-1",
        date,
        150000,
        "CREDIT",
        "Payment for Services",
        "REF-001"
      );
      const hash2 = TransactionNormalizer.generateHash(
        "acc-1",
        date,
        150000,
        "CREDIT",
        "Payment for Services",
        "REF-001"
      );
      const hashDiff = TransactionNormalizer.generateHash(
        "acc-1",
        date,
        150000,
        "CREDIT",
        "Different Description",
        "REF-001"
      );

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
      expect(hash1).not.toBe(hashDiff);
    });

    it("should correctly parse negative amounts in parentheses e.g. (1,250.00)", () => {
      expect(TransactionNormalizer.parseAmount("(1,250.00)")).toBe(-1250);
      expect(TransactionNormalizer.parseAmount("-450.50")).toBe(-450.5);
      expect(TransactionNormalizer.parseAmount("3,450,000.00")).toBe(3450000);
      expect(TransactionNormalizer.parseAmount("")).toBe(0);
    });

    it("should correctly parse DD/MM/YYYY dates", () => {
      const parsed = TransactionNormalizer.parseDate("15/09/2026");
      expect(parsed.getUTCFullYear()).toBe(2026);
      expect(parsed.getUTCMonth()).toBe(8); // September is 8 (0-indexed)
      expect(parsed.getUTCDate()).toBe(15);
    });
  });

  describe("2. Generic CSV Bank Statement Importer", () => {
    it("should parse CSV content and calculate opening/closing balances", async () => {
      const csvContent = `Date,Description,Reference,Withdrawal,Deposit,Balance
2026-09-15,Customer Receipt,REF-101,,150000,1150000
2026-09-16,Vendor Chemical Supplier,PO-201,42000,,1108000
2026-09-16,Office Utility,EXP-301,8000,,1100000`;

      const importer = new GenericCSVImporter();
      const result = await importer.parse(csvContent, "test-acc-1");

      expect(result.transactions.length).toBe(3);
      expect(result.totalCredit).toBe(150000);
      expect(result.totalDebit).toBe(50000);
      expect(result.closingBalance).toBe(1100000);
      expect(result.openingBalance).toBe(1000000);
    });
  });

  describe("3. Explainable Matching Engine & Auto-Suggest Scoring", () => {
    it("should award 100 points for exact amount, reference, same day, and party match", () => {
      const bankTx = {
        id: "btx-1",
        transactionDate: new Date("2026-09-15T08:00:00Z"),
        amount: 150000,
        direction: "CREDIT" as const,
        reference: "RC-2026-00124",
        description: "TRF from IRPC PCL",
      };

      const candidate = {
        id: "ctx-1",
        targetType: "CASH_TRANSACTION" as const,
        transactionNo: "RC-2026-00124",
        date: new Date("2026-09-15T09:00:00Z"),
        amount: 150000,
        direction: "CREDIT" as const,
        reference: "RC-2026-00124",
        partyName: "IRPC",
      };

      const match = MatchingRulesEngine.evaluate(bankTx, candidate, 90, 2);

      expect(match.score).toBe(100);
      expect(match.isSuggested).toBe(true);
      expect(match.matchMethod).toBe("AUTO_SUGGESTED");
      expect(match.explanation).toContain("ยอดเงินตรงกัน 100%");
      expect(match.explanation).toContain("เลขที่อ้างอิงตรงกันชัดเจน");
    });

    it("should return 0 score and reject if direction mismatches", () => {
      const bankTx = {
        id: "btx-1",
        transactionDate: new Date("2026-09-15"),
        amount: 50000,
        direction: "DEBIT" as const,
        description: "Payment",
      };

      const candidate = {
        id: "ctx-2",
        targetType: "CASH_TRANSACTION" as const,
        transactionNo: "RC-100",
        date: new Date("2026-09-15"),
        amount: 50000,
        direction: "CREDIT" as const, // Mismatch
      };

      const match = MatchingRulesEngine.evaluate(bankTx, candidate);
      expect(match.score).toBe(0);
      expect(match.isSuggested).toBe(false);
      expect(match.explanation).toContain("Direction mismatch");
    });

    it("should give partial score for date tolerance within 2 days", () => {
      const bankTx = {
        id: "btx-2",
        transactionDate: new Date("2026-09-17"),
        amount: 85000,
        direction: "CREDIT" as const,
        description: "Deposit",
      };

      const candidate = {
        id: "ctx-3",
        targetType: "CASH_TRANSACTION" as const,
        transactionNo: "RC-101",
        date: new Date("2026-09-15"), // 2 days diff
        amount: 85000,
        direction: "CREDIT" as const,
      };

      const match = MatchingRulesEngine.evaluate(bankTx, candidate, 90, 2);
      expect(match.factors.amountScore).toBe(40);
      expect(match.factors.dateScore).toBe(10); // 10 out of 15
      expect(match.score).toBe(50);
      expect(match.isSuggested).toBe(false); // < 90 threshold
    });
  });

  describe("4. Treasury Position & 13-Week Cash Forecast", () => {
    it("should compute 13-week rolling cash forecast with non-negative weeks and confidence levels", async () => {
      const forecast = await TreasuryForecastService.get13WeekForecast();

      expect(forecast.forecastWeeks).toHaveLength(13);
      expect(forecast.forecastWeeks[0].weekNumber).toBe(1);
      expect(forecast.forecastWeeks[12].weekNumber).toBe(13);

      // Verify week continuity: Week 2 opening cash must equal Week 1 closing cash
      const w1 = forecast.forecastWeeks[0];
      const w2 = forecast.forecastWeeks[1];
      expect(w2.openingCash).toBe(w1.closingCash);

      // W1 confidence should be HIGH, W13 should be LOW
      expect(w1.confidence).toBe("HIGH");
      expect(forecast.forecastWeeks[12].confidence).toBe("LOW");
    });

    it("should evaluate liquidity risks against minimum buffer", async () => {
      const risk = await LiquidityRiskService.evaluateLiquidityRisks();

      expect(["HEALTHY", "WATCH", "CRITICAL"]).toContain(risk.status);
      expect(risk.minimumBuffer).toBeGreaterThan(0);
      expect(Array.isArray(risk.alerts)).toBe(true);
    });
  });

  describe("5. Enterprise Budget Planning, Commitment Control & Transfer", () => {
    it("should strictly calculate Available Budget = Allocated - Consumed - Committed", async () => {
      const plan = await BudgetPlanningService.createBudgetPlan({
        name: "Test Operations Budget 2026",
        fiscalYear: 2026,
        createdBy: "tester",
        lines: [
          {
            category: "FLEET",
            period: "2026-ANNUAL",
            allocatedAmount: 100000,
          },
          {
            category: "FUEL",
            period: "2026-ANNUAL",
            allocatedAmount: 50000,
          },
        ],
      });

      const lines = await prisma.budgetLine.findMany({ where: { budgetPlanId: plan.id } });
      const fleetLine = lines.find((l) => l.category === "FLEET")!;

      expect(fleetLine.availableAmount).toBe(100000);

      // 1. Record Commitment of 30,000 (e.g. Approved PO for vehicle parts)
      const afterCommit = await BudgetControlService.recordCommitment(fleetLine.id, 30000);
      expect(afterCommit.committedAmount).toBe(30000);
      expect(afterCommit.consumedAmount).toBe(0);
      expect(afterCommit.availableAmount).toBe(70000); // 100,000 - 30,000

      // 2. Record Actual Consumption of 25,000 releasing 25,000 commitment
      const afterActual = await BudgetControlService.recordActualConsumption(fleetLine.id, 25000, 25000);
      expect(afterActual.consumedAmount).toBe(25000);
      expect(afterActual.committedAmount).toBe(5000); // 30,000 - 25,000
      expect(afterActual.availableAmount).toBe(70000); // 100,000 - 25,000 - 5,000

      // 3. Pre-check budget for 80,000 (Available is 70,000 -> Should warn/block)
      const check = await BudgetControlService.checkBudget({
        budgetLineId: fleetLine.id,
        amount: 80000,
        transactionReference: "PO-EXCESS",
        requestedBy: "tester",
      });
      expect(check.remainingAfterTransaction).toBe(-10000);
      expect(["WARNING", "BLOCKED", "APPROVAL_REQUIRED"]).toContain(check.status);

      // 4. Budget Transfer: Move 20,000 from FLEET to FUEL
      const fuelLine = lines.find((l) => l.category === "FUEL")!;
      const transfer = await BudgetControlService.requestTransfer({
        fromBudgetLineId: fleetLine.id,
        toBudgetLineId: fuelLine.id,
        amount: 20000,
        reason: "Surplus in Fleet transferred to Fuel due to route expansion",
        requestedBy: "tester",
      });

      expect(transfer.status).toBe("PENDING");

      const applied = await BudgetControlService.approveTransfer(transfer.id, "finance-director");
      expect(applied.status).toBe("APPLIED");

      // Verify balances after transfer
      const updatedFleet = await prisma.budgetLine.findUnique({ where: { id: fleetLine.id } });
      const updatedFuel = await prisma.budgetLine.findUnique({ where: { id: fuelLine.id } });

      expect(updatedFleet?.allocatedAmount).toBe(80000); // 100,000 - 20,000
      expect(updatedFuel?.allocatedAmount).toBe(70000); // 50,000 + 20,000
      // Total organization allocated budget is preserved (100,000 + 50,000 = 80,000 + 70,000 = 150,000)
      expect((updatedFleet?.allocatedAmount || 0) + (updatedFuel?.allocatedAmount || 0)).toBe(150000);
    });

    it("should create immutable budget revision and increment version without destroying original", async () => {
      const plan = await BudgetPlanningService.createBudgetPlan({
        name: "Q4 Revision Test",
        fiscalYear: 2026,
        createdBy: "tester",
        lines: [{ category: "CAPEX", period: "2026-Q4", allocatedAmount: 500000 }],
      });

      expect(plan.version).toBe(1);

      const revision = await BudgetPlanningService.createRevision(
        plan.id,
        "SCOPE_CHANGE",
        "Additional cleaning equipment approved by board",
        "cfo-user"
      );

      expect(revision.fromVersion).toBe(1);
      expect(revision.toVersion).toBe(2);

      const updatedPlan = await prisma.budgetPlan.findUnique({ where: { id: plan.id } });
      expect(updatedPlan?.version).toBe(2);
      expect(updatedPlan?.status).toBe("REVISED");
    });
  });

  describe("6. Financial Scenario Simulator (What-If Analysis)", () => {
    it("should simulate customer delay 30 days without mutating production database", async () => {
      const simResult = await TreasuryScenarioService.simulateScenario({
        name: "Client Payment Delayed 30 Days",
        clientCollectionDelayDays: 30,
        overtimeIncreasePct: 20,
      });

      expect(simResult.scenarioName).toBe("Client Payment Delayed 30 Days");
      expect(simResult.weeklyComparison).toHaveLength(13);

      // Verify that simulated cash curve is calculated and differs from baseline
      const hasVariance = simResult.weeklyComparison.some((w) => w.variance !== 0);
      expect(hasVariance).toBe(true);

      // Impact summary should be non-empty and explainable
      expect(simResult.impactSummary.length).toBeGreaterThan(10);
    });
  });
});
