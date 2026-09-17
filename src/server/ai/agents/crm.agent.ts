import { SpecializedAgent, SpecializedAgentRegistry } from "./agent-registry";
import { AgentPlannerService } from "../planning/agent-planner.service";
import { AIUserContext } from "../security/ai-authorization.service";

export const CrmCommercialAgent: SpecializedAgent = {
  code: "CRM_AGENT",
  name: "CRM, Sales & Commercial Intelligence Agent",
  domain: "CRM",
  description: "ผู้ช่วยติดตามลูกค้า ร่างบันทึกการประสานงาน (Follow-up) และสรุปโครงร่างใบเสนอราคา",
  allowedTools: [
    "getOpportunityDetail",
    "draftCustomerFollowup",
    "draftProposalOutline",
    "draftEstimateScenario",
  ],
  maxRiskLevel: "MEDIUM",
  status: "ACTIVE",
  systemPrompt: `You are the SmartJeff CRM & Sales Agent.
Prepare customer follow-up notes, summarize lead history, and draft proposal outlines.
Guardrail: You cannot approve final contract prices or authorize signed quotations.`,

  processIntent: async (userGoal: string, user: AIUserContext, contextParams?: Record<string, any>) => {
    const leadId = contextParams?.leadId || "lead-scg-01";

    const plan = AgentPlannerService.createPlan({
      userGoal,
      agentCode: "CRM_AGENT",
      domain: "CRM",
      proposedActionType: "CREATE_CUSTOMER_FOLLOWUP",
      suggestedSteps: [
        {
          description: "ดึงประวัติการเจรจาและสถานะไปป์ไลน์ล่าสุด",
          toolName: "getOpportunityDetail",
          inputParameters: { leadId },
        },
        {
          description: "สร้างบันทึกการติดตามลูกค้าฉบับร่าง (Draft Follow-up Activity)",
          toolName: "draftCustomerFollowup",
          inputParameters: { leadId },
        },
      ],
    });

    return {
      plan,
      proposedAction: {
        actionType: "CREATE_CUSTOMER_FOLLOWUP",
        resourceType: "CRM_ACTIVITY",
        inputPayload: {
          leadId,
          type: "CALL_FOLLOWUP",
          summary: "นัดหมายนำเสนอแพ็กเกจระบบรักษาความปลอดภัยและกำลังพล SmartJeff ภายในวันศุกร์นี้",
          nextStep: "ส่งร่างใบเสนอราคาเบื้องต้น",
        },
        previewData: {
          title: `บันทึกกิจกรรมติดตามลูกค้า (${leadId})`,
          summary: `นัดหมายนำเสนอระบบ และจัดส่งใบเสนอราคาเบื้องต้น`,
          affectedRecords: [{ type: "CRM_LEAD", id: leadId, name: "บจก. สยาม ซีเมนต์ กรุ๊ป" }],
          conflicts: [],
        },
        permissionRequired: "CRM_EDIT",
      },
      explanation: `ได้จัดเตรียมบันทึกการติดตามลูกค้าสำหรับ ${leadId} เรียบร้อยแล้ว พร้อมส่งต่อให้ทีมขายดำเนินการต่อ`,
    };
  },
};

SpecializedAgentRegistry.register(CrmCommercialAgent);
