import { NextRequest, NextResponse } from "next/server";
import { OperationsScenarioService } from "@/server/services/operations-scenario.service";
import { TreasuryScenarioService } from "@/server/services/finance/treasury-scenario.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scenarioType, workforceParams, financialParams } = body;

    if (scenarioType === "WORKFORCE") {
      if (!workforceParams?.siteId) {
        return NextResponse.json({ success: false, error: "siteId is required for WORKFORCE scenario." }, { status: 400 });
      }
      const result = await OperationsScenarioService.runScenario(workforceParams);
      return NextResponse.json({ success: true, scenarioType, result });
    }

    if (scenarioType === "FINANCIAL") {
      const result = await TreasuryScenarioService.simulateScenario(financialParams || {});
      return NextResponse.json({ success: true, scenarioType, result });
    }

    if (scenarioType === "MULTI_DOMAIN") {
      const [workforceResult, financialResult] = await Promise.all([
        workforceParams?.siteId ? OperationsScenarioService.runScenario(workforceParams).catch(() => null) : null,
        TreasuryScenarioService.simulateScenario(financialParams || {}).catch(() => null),
      ]);

      return NextResponse.json({
        success: true,
        scenarioType,
        result: {
          workforce: workforceResult,
          financial: financialResult,
          crossDomainInsight: "การจำลองแบบรวมหลายมิติช่วยประเมินผลกระทบร่วมกันระหว่างกำลังคนและกระแสเงินสดสำรอง",
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid scenarioType. Allowed: WORKFORCE, FINANCIAL, MULTI_DOMAIN" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
