import { NextResponse } from "next/server";
import { TreasuryScenarioService } from "@/server/services/finance/treasury-scenario.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      clientCollectionDelayDays,
      supplierPaymentAdvanceDays,
      overtimeIncreasePct,
      fuelPriceIncreasePct,
      projectDelayWeeks,
    } = body;

    const result = await TreasuryScenarioService.simulateScenario({
      name: name || "Custom Scenario",
      clientCollectionDelayDays: clientCollectionDelayDays
        ? parseInt(clientCollectionDelayDays, 10)
        : 0,
      supplierPaymentAdvanceDays: supplierPaymentAdvanceDays
        ? parseInt(supplierPaymentAdvanceDays, 10)
        : 0,
      overtimeIncreasePct: overtimeIncreasePct ? parseFloat(overtimeIncreasePct) : 0,
      fuelPriceIncreasePct: fuelPriceIncreasePct ? parseFloat(fuelPriceIncreasePct) : 0,
      projectDelayWeeks: projectDelayWeeks ? parseInt(projectDelayWeeks, 10) : 0,
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to simulate treasury scenario" },
      { status: 500 }
    );
  }
}
