import { SpecializedAgent, SpecializedAgentRegistry } from "./agent-registry";
import { AgentPlannerService } from "../planning/agent-planner.service";
import { AIUserContext } from "../security/ai-authorization.service";

export const QhseAgent: SpecializedAgent = {
  code: "QHSE_AGENT",
  name: "Quality, Health, Safety & Environment (QHSE) Agent",
  domain: "QHSE",
  description: "ผู้ช่วยวิเคราะห์อุบัติการณ์ความปลอดภัย ร่างแผนปฏิบัติการแก้ไขและป้องกัน (CAPA)",
  allowedTools: [
    "getIncidentDetail",
    "draftIncidentSummary",
    "draftInvestigationPlan",
    "draftCAPA",
  ],
  maxRiskLevel: "HIGH",
  status: "ACTIVE",
  systemPrompt: `You are the SmartJeff QHSE Safety Agent.
Assist safety officers in summarizing incidents and drafting Corrective & Preventive Action (CAPA) plans.
Guardrail: You must NEVER assign personal blame or close critical safety violations. Final safety sign-off must be performed by certified Safety Officers.`,

  processIntent: async (userGoal: string, user: AIUserContext, contextParams?: Record<string, any>) => {
    const incidentId = contextParams?.incidentId || "inc-safety-09";

    const plan = AgentPlannerService.createPlan({
      userGoal,
      agentCode: "QHSE_AGENT",
      domain: "QHSE",
      proposedActionType: "CREATE_DRAFT_CAPA",
      suggestedSteps: [
        {
          description: "ดึงข้อมูลบันทึกข้อเท็จจริงและหลักฐานภาพถ่ายอุบัติการณ์",
          toolName: "getIncidentDetail",
          inputParameters: { incidentId },
        },
        {
          description: "ร่างแผนปฏิบัติการแก้ไขและป้องกัน (Draft CAPA)",
          toolName: "draftCAPA",
          inputParameters: { incidentId },
        },
      ],
    });

    return {
      plan,
      proposedAction: {
        actionType: "CREATE_DRAFT_CAPA",
        resourceType: "CAPA",
        inputPayload: {
          incidentId,
          rootCauseHypothesis: "พื้นผิวทางเดินมีความลื่นจากคราบน้ำมัน และป้ายเตือนไม่ชัดเจน",
          correctiveAction: "ทำความสะอาดคราบน้ำมันและติดตั้งแผ่นยางกันลื่น",
          preventiveAction: "เพิ่มรอบตรวจสอบประจำวันของหัวหน้ากะและติดตั้งป้ายไฟเตือนถาวร",
          targetDays: 7,
        },
        previewData: {
          title: `ร่างแผน CAPA สำหรับอุบัติการณ์ ${incidentId}`,
          summary: `แผนแก้ไขปัญหาพื้นผิวลื่นและเพิ่มรอบตรวจประเมินความปลอดภัยประจำวัน`,
          affectedRecords: [{ type: "INCIDENT", id: incidentId, name: "เหตุการณ์ลื่นล้มบริเวณลานขนถ่ายสินค้า" }],
          conflicts: [],
        },
        permissionRequired: "QHSE_EDIT",
      },
      explanation: `ได้จัดทำร่างแผนปฏิบัติการแก้ไขและป้องกัน (CAPA) สำหรับอุบัติการณ์ ${incidentId} พร้อมมาตรการแก้ไขเร่งด่วนและป้องกันระยะยาว`,
    };
  },
};

SpecializedAgentRegistry.register(QhseAgent);
