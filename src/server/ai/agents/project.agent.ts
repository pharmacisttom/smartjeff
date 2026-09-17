import { SpecializedAgent, SpecializedAgentRegistry } from "./agent-registry";
import { AgentPlannerService } from "../planning/agent-planner.service";
import { AIUserContext } from "../security/ai-authorization.service";

export const ProjectAgent: SpecializedAgent = {
  code: "PROJECT_AGENT",
  name: "Site Project & Work Order Operations Agent",
  domain: "PROJECT",
  description: "ผู้ช่วยสร้างใบสั่งงาน (Work Order) ร่างแผนงานโครงการ และจัดสรรทรัพยากรหน้างาน",
  allowedTools: [
    "getProjectMilestones",
    "draftWorkOrder",
    "draftProjectPlan",
    "simulateProjectResourcePlan",
  ],
  maxRiskLevel: "MEDIUM",
  status: "ACTIVE",
  systemPrompt: `You are the SmartJeff Project Operations Agent.
Help project managers coordinate work orders, track phase completion, and prepare resource allocation drafts.`,

  processIntent: async (userGoal: string, user: AIUserContext, contextParams?: Record<string, any>) => {
    const projectId = contextParams?.projectId || "proj-changi-01";

    const plan = AgentPlannerService.createPlan({
      userGoal,
      agentCode: "PROJECT_AGENT",
      domain: "PROJECT",
      proposedActionType: "CREATE_DRAFT_WORK_ORDER",
      suggestedSteps: [
        {
          description: "ตรวจสอบความคืบหน้า Milestone และทรัพยากรหน้างาน",
          toolName: "getProjectMilestones",
          inputParameters: { projectId },
        },
        {
          description: "สร้างใบสั่งงานฉบับร่าง (Draft Work Order)",
          toolName: "draftWorkOrder",
          inputParameters: { projectId },
        },
      ],
    });

    return {
      plan,
      proposedAction: {
        actionType: "CREATE_DRAFT_WORK_ORDER",
        resourceType: "WORK_ORDER",
        inputPayload: {
          projectId,
          title: "งานติดตั้งระบบกล้องวงจรปิดรอบรั้วโครงการ",
          scope: "เดินสายไฟเบอร์ออปติก 4 จุด และทดสอบมุมกล้องความละเอียด 4K",
          targetCompletionDays: 3,
        },
        previewData: {
          title: `สร้างใบสั่งงาน Work Order โครงการ ${projectId}`,
          summary: `งานติดตั้งระบบกล้องวงจรปิดรอบรั้วโครงการ ระยะเวลาปฏิบัติงาน 3 วัน`,
          affectedRecords: [{ type: "PROJECT", id: projectId, name: "โครงการติดตั้งระบบความปลอดภัย" }],
          conflicts: [],
        },
        permissionRequired: "PROJECT_EDIT",
      },
      explanation: `ได้จัดเตรียมร่างใบสั่งงาน (Work Order) สำหรับโครงการ ${projectId} พร้อมระบุขอบเขตงานและกรอบเวลาปฏิบัติงาน 3 วัน`,
    };
  },
};

SpecializedAgentRegistry.register(ProjectAgent);
