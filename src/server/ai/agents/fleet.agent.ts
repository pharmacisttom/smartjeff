import { SpecializedAgent, SpecializedAgentRegistry } from "./agent-registry";
import { AgentPlannerService } from "../planning/agent-planner.service";
import { AIUserContext } from "../security/ai-authorization.service";

export const FleetAgent: SpecializedAgent = {
  code: "FLEET_AGENT",
  name: "Fleet, Route & Logistics Operations Agent",
  domain: "FLEET",
  description: "ผู้ช่วยจัดรถ จัดเส้นทางขนส่ง และจับคู่ยานพาหนะกับคนขับตามมาตรฐานความปลอดภัย",
  allowedTools: [
    "getVehicleAvailability",
    "getDriverAvailability",
    "draftTrip",
    "suggestVehicleOptions",
    "simulateRoutePlan",
  ],
  maxRiskLevel: "MEDIUM",
  status: "ACTIVE",
  systemPrompt: `You are the SmartJeff Fleet & Logistics Agent.
Analyze vehicle availability, maintenance schedules, driver work hours, and routes to prepare draft trips.
Guardrail: Emergency vehicle dispatch must be confirmed by human dispatchers.`,

  processIntent: async (userGoal: string, user: AIUserContext, contextParams?: Record<string, any>) => {
    const destinationSiteId = contextParams?.siteId || "site-eastern-seaboard";
    const departureDate = contextParams?.date || new Date().toISOString().split("T")[0];

    const plan = AgentPlannerService.createPlan({
      userGoal,
      agentCode: "FLEET_AGENT",
      domain: "FLEET",
      proposedActionType: "CREATE_DRAFT_TRIP",
      suggestedSteps: [
        {
          description: "ตรวจสอบยานพาหนะที่ว่างและไม่ติดรอบซ่อมบำรุง",
          toolName: "getVehicleAvailability",
          inputParameters: { date: departureDate },
        },
        {
          description: "ตรวจสอบใบขับขี่และชั่วโมงพักผ่อนของพนักงานขับรถ",
          toolName: "getDriverAvailability",
          inputParameters: { date: departureDate },
        },
        {
          description: "ร่างใบงานการเดินทาง (Draft Trip Schedule)",
          toolName: "draftTrip",
          inputParameters: { destinationSiteId, departureDate },
        },
      ],
    });

    return {
      plan,
      proposedAction: {
        actionType: "CREATE_DRAFT_TRIP",
        resourceType: "FLEET_TRIP",
        inputPayload: {
          destinationSiteId,
          vehiclePlate: "1ฒภ-9874 กทม.",
          driverName: "ประเสริฐ ขับขี่ดี",
          departureDate,
          estimatedDistanceKm: 142,
        },
        previewData: {
          title: `จัดรถเดินทางไปยังไซต์งาน ${destinationSiteId}`,
          summary: `มอบหมายรถตู้ 1ฒภ-9874 พร้อมพนักงานขับรถ ประเสริฐ ขับขี่ดี ระยะทางประมาณ 142 กม.`,
          affectedRecords: [
            { type: "VEHICLE", id: "veh_12", name: "1ฒภ-9874 กทม." },
            { type: "DRIVER", id: "drv_05", name: "ประเสริฐ ขับขี่ดี" },
          ],
          conflicts: [],
        },
        permissionRequired: "FLEET_CREATE",
      },
      explanation: `ได้จัดเตรียมการเดินทางไปยัง ${destinationSiteId} ตรวจสอบสถานะรถและคนขับพร้อมปฏิบัติงาน ไม่พบข้อขัดแย้งด้านตารางงาน`,
    };
  },
};

SpecializedAgentRegistry.register(FleetAgent);
