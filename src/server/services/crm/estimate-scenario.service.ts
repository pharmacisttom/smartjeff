import { prisma } from "@/lib/prisma";

export interface ScenarioModifiers {
  headcountDelta?: number; // e.g. +5
  headcountDailyRate?: number; // default 600
  workdays?: number; // default 30
  fuelPricePercentDelta?: number; // e.g. +10%
  otPercentDelta?: number; // e.g. +20%
  materialCostPercentDelta?: number; // e.g. +5%
  targetMarginPercentOverride?: number;
}

export class EstimateScenarioService {
  /**
   * Run What-if Scenario without modifying production database
   */
  static async simulateScenario(estimateId: string, modifiers: ScenarioModifiers) {
    const estimate = await prisma.opportunityEstimate.findUnique({
      where: { id: estimateId },
      include: { lines: true, assumptions: true },
    });
    if (!estimate) throw new Error("Estimate not found");

    let simulatedDirectCost = 0;
    const simulatedLines = [];

    // 1. Process existing lines with percentage modifiers
    for (const line of estimate.lines) {
      let cost = line.totalCost;
      let note = line.notes || "";

      if (line.category === "FUEL" && modifiers.fuelPricePercentDelta) {
        const factor = 1 + modifiers.fuelPricePercentDelta / 100;
        cost = Math.round(cost * factor);
        note += ` [Simulated Fuel Delta: ${modifiers.fuelPricePercentDelta > 0 ? "+" : ""}${modifiers.fuelPricePercentDelta}%]`;
      } else if (line.category === "OT" && modifiers.otPercentDelta) {
        const factor = 1 + modifiers.otPercentDelta / 100;
        cost = Math.round(cost * factor);
        note += ` [Simulated OT Delta: ${modifiers.otPercentDelta > 0 ? "+" : ""}${modifiers.otPercentDelta}%]`;
      } else if (line.category === "MATERIAL" && modifiers.materialCostPercentDelta) {
        const factor = 1 + modifiers.materialCostPercentDelta / 100;
        cost = Math.round(cost * factor);
        note += ` [Simulated Material Delta: ${modifiers.materialCostPercentDelta > 0 ? "+" : ""}${modifiers.materialCostPercentDelta}%]`;
      }

      simulatedDirectCost += cost;
      simulatedLines.push({
        ...line,
        totalCost: cost,
        notes: note,
      });
    }

    // 2. Add headcount delta if specified
    if (modifiers.headcountDelta && modifiers.headcountDelta !== 0) {
      const deltaCount = modifiers.headcountDelta;
      const days = modifiers.workdays || 30;
      const rate = modifiers.headcountDailyRate || 600;
      const additionalLabor = deltaCount * days * rate;
      simulatedDirectCost += additionalLabor;

      simulatedLines.push({
        id: "sim-additional-labor",
        estimateId,
        category: "WORKFORCE",
        description: `Simulated Additional Labor (${deltaCount > 0 ? "+" : ""}${deltaCount} persons x ${days} days)`,
        quantity: Math.abs(deltaCount * days),
        unit: "man-day",
        unitCost: rate,
        totalCost: additionalLabor,
        sourceType: "SCENARIO_SIMULATION",
        sourceReference: "What-If Simulation",
        notes: `Simulated worker adjustment`,
        createdAt: new Date(),
      });
    }

    // 3. Overhead and Contingency calculation
    const overheadAmount = Math.round(simulatedDirectCost * (estimate.overheadPercent / 100));
    const contingencyAmount = Math.round(simulatedDirectCost * (estimate.contingencyPercent / 100));
    const totalEstimatedCost = simulatedDirectCost + overheadAmount + contingencyAmount;

    // 4. Margin and Suggested Price
    const targetMarginPercent = modifiers.targetMarginPercentOverride ?? estimate.targetMarginPercent;
    const suggestedPrice =
      targetMarginPercent < 100 && targetMarginPercent > 0
        ? Math.round(totalEstimatedCost / (1 - targetMarginPercent / 100))
        : Math.round(totalEstimatedCost * 1.2);
    const targetMarginAmount = suggestedPrice - totalEstimatedCost;

    const varianceCost = totalEstimatedCost - estimate.totalEstimatedCost;
    const variancePercent =
      estimate.totalEstimatedCost > 0
        ? parseFloat(((varianceCost / estimate.totalEstimatedCost) * 100).toFixed(2))
        : 0;

    return {
      scenarioName: "What-If Simulation",
      isSimulation: true,
      originalCost: estimate.totalEstimatedCost,
      originalPrice: estimate.suggestedPrice,
      simulatedDirectCost,
      simulatedOverheadAmount: overheadAmount,
      simulatedContingencyAmount: contingencyAmount,
      simulatedTotalCost: totalEstimatedCost,
      simulatedSuggestedPrice: suggestedPrice,
      simulatedTargetMarginAmount: targetMarginAmount,
      targetMarginPercent,
      varianceCost,
      variancePercent,
      modifiers,
      simulatedLines,
    };
  }
}
