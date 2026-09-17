import { describe, it, expect } from "vitest";
import { WorkforceEstimationService } from "@/server/services/crm/workforce-estimation.service";
import { FleetEstimationService } from "@/server/services/crm/fleet-estimation.service";
import { PricingService } from "@/server/services/crm/pricing.service";

describe("Phase 17: Estimation & Pricing Engine Tests", () => {
  it("should calculate Workforce estimate accurately matching prompt example", () => {
    // Prompt example: Security Worker: 20 คน, 30 วัน, Daily Cost: 600 => Estimated: 360,000
    const result = WorkforceEstimationService.calculateRoleCost({
      role: "Security Worker",
      headcount: 20,
      workdays: 30,
      dailyRate: 600,
    });

    expect(result.headcount).toBe(20);
    expect(result.workdays).toBe(30);
    expect(result.baseLaborCost).toBe(360000);
    expect(result.otCost).toBe(0);
    expect(result.totalLaborCost).toBe(360000);
    expect(result.lineItems.length).toBe(1);
    expect(result.lineItems[0].category).toBe("WORKFORCE");
    expect(result.lineItems[0].quantity).toBe(600); // 20 * 30 man-days
  });

  it("should calculate expected Overtime accurately", () => {
    // 10 persons x 20 days x 2 hrs OT per day @ 600 daily rate
    // default hourly rate = 600 / 8 * 1.5 = 112.5 THB/hr
    // total OT hours = 10 * 20 * 2 = 400 hrs
    // expected OT cost = 400 * 112.5 = 45,000 THB
    const result = WorkforceEstimationService.calculateRoleCost({
      role: "Technician",
      headcount: 10,
      workdays: 20,
      dailyRate: 600,
      otHoursPerDay: 2,
    });

    expect(result.baseLaborCost).toBe(120000);
    expect(result.otCost).toBe(45000);
    expect(result.totalLaborCost).toBe(165000);
    expect(result.lineItems.length).toBe(2);
    expect(result.lineItems.some((l) => l.category === "OT")).toBe(true);
  });

  it("should calculate Fleet vehicle and fuel cost with traceable formula", () => {
    // 2 pickup trucks x 30 trips x 100 km per trip = 6,000 total km
    // efficiency = 10 km/L => 600 Liters of fuel
    // fuel price = 35 THB/L => 21,000 THB fuel cost
    // maintenance = 60 trips x 50 THB = 3,000 THB
    const result = FleetEstimationService.calculateVehicleFleetCost({
      vehicleType: "Pickup Truck 4x4",
      quantity: 2,
      trips: 30,
      distanceKmPerTrip: 100,
      fuelEfficiencyKmPerLiter: 10,
      fuelPricePerLiter: 35,
      maintenanceAllocationPerTrip: 50,
    });

    expect(result.totalDistanceKm).toBe(6000);
    expect(result.totalFuelLiters).toBe(600);
    expect(result.fuelCost).toBe(21000);
    expect(result.maintenanceCost).toBe(3000);
    expect(result.totalFleetCost).toBe(24000);
    expect(result.lineItems.some((l) => l.category === "FUEL")).toBe(true);
  });

  it("should calculate Pricing with Target Margin, VAT, and trigger price guardrail if below cost", () => {
    // Cost = 100,000
    // Target margin = 20% => Base price = 100,000 / (1 - 0.2) = 125,000 => Margin = 25,000
    const pricing = PricingService.calculatePricing({
      estimatedCost: 100000,
      targetMarginPercent: 20,
      taxPercent: 7,
    });

    expect(pricing.estimatedCost).toBe(100000);
    expect(pricing.targetMarginAmount).toBe(25000);
    expect(pricing.subtotalAfterDiscount).toBe(125000);
    expect(pricing.taxAmount).toBe(8750); // 7% of 125,000
    expect(pricing.finalPrice).toBe(133750);
    expect(pricing.effectiveMarginPercent).toBe(20);
    expect(pricing.requiresExecutiveApproval).toBe(false);
  });

  it("should enforce Price Guardrail when selling price is below cost", () => {
    // Heavy discount of 40,000 on 125,000 subtotal => 85,000 selling price < 100,000 cost
    const pricing = PricingService.calculatePricing({
      estimatedCost: 100000,
      targetMarginPercent: 20,
      discountAmount: 40000,
      taxPercent: 7,
    });

    expect(pricing.subtotalAfterDiscount).toBe(85000);
    expect(pricing.requiresExecutiveApproval).toBe(true);
    expect(pricing.guardrailWarnings.some((w) => w.includes("below total estimated cost"))).toBe(true);
  });
});
