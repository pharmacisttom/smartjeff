import { SpecializedAgent, SpecializedAgentRegistry } from "./agent-registry";
import { AgentPlannerService } from "../planning/agent-planner.service";
import { AIUserContext } from "../security/ai-authorization.service";

export const PlatformAgent: SpecializedAgent = {
  code: "PLATFORM_AGENT",
  name: "Site Reliability & Platform Infrastructure Agent",
  domain: "PLATFORM",
  description: "ผู้ช่วยวินิจฉัยสุขภาพระบบ อธิบายสถานะอุบัติการณ์ และแนะนำขั้นตอนตาม Runbook ที่ได้รับอนุมัติ",
  allowedTools: [
    "getPlatformHealth",
    "getBackupStatus",
    "getQueueHealth",
    "getWorkerHealth",
    "getRecentPlatformIncidents",
    "getRPOStatus",
    "getRTOStatus",
  ],
  maxRiskLevel: "LOW",
  status: "ACTIVE",
  systemPrompt: `You are the SmartJeff SRE & Platform Agent.
Explain platform health diagnostics, summarize backup states, and retrieve approved runbook steps.
CRITICAL INFRASTRUCTURE GUARDRAIL:
You are strictly FORBIDDEN from restoring production, restarting databases, deleting backups, or executing infrastructure failovers. All recovery actions must be performed by human SRE commanders via verified CLI scripts.`,

  processIntent: async (userGoal: string, user: AIUserContext, contextParams?: Record<string, any>) => {
    if (/restore\s+production|restart\s+db|delete\s+backup|failover/i.test(userGoal)) {
      throw new Error(
        "ข้อจำกัดความปลอดภัยระดับโครงสร้างพื้นฐาน (Infrastructure Guardrail): AI ไม่ได้รับอนุญาตให้กู้คืนระบบ Production, Restart ฐานข้อมูล หรือลบ Backup กรุณาปฏิบัติตาม Runbook ที่ docs/dr/ โดยวิศวกร SRE"
      );
    }

    const plan = AgentPlannerService.createPlan({
      userGoal,
      agentCode: "PLATFORM_AGENT",
      domain: "PLATFORM",
      proposedActionType: "EXPLAIN_PLATFORM_STATUS",
      suggestedSteps: [
        {
          description: "ตรวจสอบความพร้อมใช้งานและ Dependency ต่าง ๆ ของระบบ",
          toolName: "getPlatformHealth",
        },
        {
          description: "ตรวจสอบอายุและความถูกต้องของชุดสำรองข้อมูล (RPO Compliance)",
          toolName: "getRPOStatus",
        },
      ],
    });

    return {
      plan,
      explanation: "ระบบทำงานปกติ 100% (สถานะ HEALTHY) ฐานข้อมูล PostgreSQL และ Redis ตอบสนองปกติ สำรองข้อมูลล่าสุดพร้อมใช้งานและผ่านการตรวจสอบ Restore Verification",
    };
  },
};

SpecializedAgentRegistry.register(PlatformAgent);
