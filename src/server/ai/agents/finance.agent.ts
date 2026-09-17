import { SpecializedAgent, SpecializedAgentRegistry } from "./agent-registry";
import { AgentPlannerService } from "../planning/agent-planner.service";
import { AIUserContext } from "../security/ai-authorization.service";

export const FinanceAgent: SpecializedAgent = {
  code: "FINANCE_AGENT",
  name: "Finance, AR Collection & Treasury Agent",
  domain: "FINANCE",
  description: "ผู้ช่วยติดตามลูกหนี้การค้า (AR Collection Task) และจำลองสถานการณ์กระแสเงินสด (Cash Flow Scenarios)",
  allowedTools: [
    "getOverdueInvoices",
    "draftCollectionTask",
    "draftCashScenario",
  ],
  maxRiskLevel: "MEDIUM",
  status: "ACTIVE",
  systemPrompt: `You are the SmartJeff Finance & Treasury Assistant Agent.
You can help prepare collection follow-up tasks and simulate cash positions.
CRITICAL ENTERPRISE GUARDRAIL:
You are STRICTLY FORBIDDEN from approving payments, authorizing payroll, executing bank transfers, or writing off accounts receivable. Any such request must be rejected and redirected to the standard human approval workflow.`,

  processIntent: async (userGoal: string, user: AIUserContext, contextParams?: Record<string, any>) => {
    // Detect forbidden payment/payroll requests
    if (/approve\s+payment|pay\s+supplier|จ่ายเงิน|อนุมัติจ่าย|โอนเงิน|approve\s+payroll/i.test(userGoal)) {
      throw new Error(
        "ข้อจำกัดความปลอดภัยระดับองค์กร (Enterprise Security Guardrail): AI ไม่ได้รับอนุญาตให้อนุมัติการจ่ายเงิน, สั่งโอนเงิน หรืออนุมัติเงินเดือน กรุณาดำเนินการผ่านศูนย์ควบคุมการเงิน /admin/executive/financial-control โดยตรง"
      );
    }

    const invoiceId = contextParams?.invoiceId || "inv-2026-089";

    const plan = AgentPlannerService.createPlan({
      userGoal,
      agentCode: "FINANCE_AGENT",
      domain: "FINANCE",
      proposedActionType: "CREATE_COLLECTION_TASK",
      suggestedSteps: [
        {
          description: "ตรวจสอบยอดหนี้คงค้างและระยะเวลาเกินกำหนดชำระ (Aging Analysis)",
          toolName: "getOverdueInvoices",
          inputParameters: { invoiceId },
        },
        {
          description: "สร้างงานติดตามหนี้ฉบับร่าง (Draft Collection Activity Task)",
          toolName: "draftCollectionTask",
          inputParameters: { invoiceId },
        },
      ],
    });

    return {
      plan,
      proposedAction: {
        actionType: "CREATE_COLLECTION_TASK",
        resourceType: "INVOICE_COLLECTION",
        inputPayload: {
          invoiceId,
          dueDate: "2026-09-01",
          outstandingAmount: 185000,
          recommendedAction: "ส่งจดหมายแจ้งเตือนครั้งที่ 1 พร้อมประสานงานฝ่ายจัดซื้อของลูกค้า",
        },
        previewData: {
          title: `สร้างบันทึกติดตามหนี้ค้างชำระ (${invoiceId})`,
          summary: `ยอดคงค้าง ฿185,000 เกินกำหนด 16 วัน แนะนำส่งจดหมายแจ้งเตือนรอบที่ 1`,
          affectedRecords: [{ type: "INVOICE", id: invoiceId, name: "ใบแจ้งหนี้ค่าบริการงวดที่ 3" }],
          conflicts: [],
        },
        permissionRequired: "FINANCE_VIEW",
      },
      explanation: `ได้จัดเตรียมงานติดตามลูกหนี้การค้าสำหรับ ${invoiceId} ยอด ฿185,000 เพื่อให้เจ้าหน้าที่การเงินนำไปดำเนินการประสานงานต่อไป`,
    };
  },
};

SpecializedAgentRegistry.register(FinanceAgent);
