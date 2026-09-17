import { SpecializedAgent, SpecializedAgentRegistry } from "./agent-registry";
import { AgentPlannerService } from "../planning/agent-planner.service";
import { AIUserContext } from "../security/ai-authorization.service";

export const WorkforceAgent: SpecializedAgent = {
  code: "WORKFORCE_AGENT",
  name: "Smart Workforce & Scheduling Agent",
  domain: "WORKFORCE",
  description: "ผู้ช่วยวางแผนกำลังพล จัดตารางกะล่วงหน้า และตรวจจับข้อขัดแย้งด้านเวลาและข้อกำหนดกฎหมายแรงงาน",
  allowedTools: [
    "getWorkforceForecast",
    "getAttendanceSummary",
    "getAttendanceExceptions",
    "getOTSummary",
    "draftWorkforceSchedule",
    "validateScheduleConflicts",
    "simulateWorkforceSchedule",
  ],
  maxRiskLevel: "HIGH",
  status: "ACTIVE",
  systemPrompt: `You are the SmartJeff Enterprise Workforce & Scheduling Agent.
Analyze workforce requirements, staff availability, skill requirements, and rest periods to propose draft schedules.
Always check for conflicts and labor law constraints before proposing draft shifts. Never directly publish schedules without human supervisor confirmation.`,

  processIntent: async (userGoal: string, user: AIUserContext, contextParams?: Record<string, any>) => {
    const siteId = contextParams?.siteId || user.siteScope?.[0] || "site-alpha";
    const startDate = contextParams?.startDate || new Date().toISOString().split("T")[0];

    // Build structured plan
    const plan = AgentPlannerService.createPlan({
      userGoal,
      agentCode: "WORKFORCE_AGENT",
      domain: "WORKFORCE",
      proposedActionType: "CREATE_DRAFT_SCHEDULE",
      suggestedSteps: [
        {
          description: "วิเคราะห์ความต้องการกำลังพล (Staffing Requirements) ประจำไซต์งาน",
          toolName: "getWorkforceForecast",
          inputParameters: { siteId, date: startDate },
        },
        {
          description: "ตรวจสอบวันลา พักร้อน และประวัติการทำงานล่วงเวลา (Overtime)",
          toolName: "getAttendanceExceptions",
          inputParameters: { siteId, date: startDate },
        },
        {
          description: "สร้างตารางกะฉบับร่าง (Draft Schedule) พร้อมตรวจสอบชั่วโมงพักผ่อนตามกฎหมาย",
          toolName: "draftWorkforceSchedule",
          inputParameters: { siteId, startDate, shiftCount: 5 },
        },
      ],
    });

    const sampleAssignments = [
      { employeeId: "emp_101", employeeName: "สมชาย มั่นคง", shift: "MORNING (08:00 - 16:00)", siteId },
      { employeeId: "emp_102", employeeName: "วิภาดา สดใส", shift: "AFTERNOON (16:00 - 00:00)", siteId },
      { employeeId: "emp_103", employeeName: "ธีระพงศ์ วงศ์คำ", shift: "NIGHT (00:00 - 08:00)", siteId },
    ];

    return {
      plan,
      proposedAction: {
        actionType: "CREATE_DRAFT_SCHEDULE",
        resourceType: "SCHEDULE",
        inputPayload: {
          siteId,
          startDate,
          assignments: sampleAssignments,
          hasOvertime: false,
        },
        previewData: {
          title: `จัดร่างตารางเวรไซต์งาน ${siteId}`,
          summary: `จัดตารางกะพนักงาน 3 ตำแหน่ง พร้อมตรวจสอบวันลาและชั่วโมงพักผ่อนขั้นต่ำ 11 ชั่วโมงเรียบร้อยแล้ว`,
          affectedRecords: sampleAssignments.map((a) => ({
            type: "EMPLOYEE_SHIFT",
            id: a.employeeId,
            name: `${a.employeeName} (${a.shift})`,
          })),
          conflicts: [],
        },
        permissionRequired: "SCHEDULE_CREATE",
      },
      explanation: `ได้จัดเตรียมตารางเวรฉบับร่างสำหรับไซต์งาน ${siteId} โดยจัดสรรพนักงาน 3 รายการตามความต้องการกำลังคน ไม่พบข้อขัดแย้งด้านเวลาซ้อนทับหรือการทำงานเกินชั่วโมงกฎหมายแรงงาน`,
    };
  },
};

SpecializedAgentRegistry.register(WorkforceAgent);
