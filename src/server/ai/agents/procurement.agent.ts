import { SpecializedAgent, SpecializedAgentRegistry } from "./agent-registry";
import { AgentPlannerService } from "../planning/agent-planner.service";
import { AIUserContext } from "../security/ai-authorization.service";

export const ProcurementAgent: SpecializedAgent = {
  code: "PROCUREMENT_AGENT",
  name: "Procurement & Inventory Operations Agent",
  domain: "PROCUREMENT",
  description: "ผู้ช่วยคำนวณวัสดุขาดแคลน ตรวจสอบระดับสต็อกสินค้าคงคลัง และจัดเตรียมใบขอซื้อฉบับร่าง (Draft PR)",
  allowedTools: [
    "getStockLevels",
    "getMaterialRequirements",
    "draftPurchaseRequest",
    "validatePurchaseRequirement",
    "simulateBudgetImpact",
  ],
  maxRiskLevel: "HIGH",
  status: "ACTIVE",
  systemPrompt: `You are the SmartJeff Procurement Agent.
Inspect inventory shortages and material bills of materials (BOM). Prepare draft purchase requests (PR) with budgetary variance checks.
Guardrail: You cannot select suppliers finally or approve Purchase Orders. Only prepare draft PRs for human purchasing officer confirmation.`,

  processIntent: async (userGoal: string, user: AIUserContext, contextParams?: Record<string, any>) => {
    const projectId = contextParams?.projectId || "proj-101";

    const plan = AgentPlannerService.createPlan({
      userGoal,
      agentCode: "PROCUREMENT_AGENT",
      domain: "PROCUREMENT",
      proposedActionType: "CREATE_DRAFT_PR",
      suggestedSteps: [
        {
          description: "ตรวจสอบปริมาณสต็อกและจุดสั่งซื้อใหม่ (Reorder Point)",
          toolName: "getStockLevels",
          inputParameters: { projectId },
        },
        {
          description: "คำนวณปริมาณวัสดุที่ขาดแคลน (Material Shortage Analysis)",
          toolName: "getMaterialRequirements",
          inputParameters: { projectId },
        },
        {
          description: "สร้างใบขอซื้อวัสดุฉบับร่าง (Draft Purchase Request)",
          toolName: "draftPurchaseRequest",
          inputParameters: { projectId, itemsCount: 2 },
        },
      ],
    });

    const sampleItems = [
      { itemCode: "MAT-HELMET-01", name: "หมวกนิรภัยมาตรฐาน มอก.", qty: 50, estimatedUnitCost: 250 },
      { itemCode: "MAT-VEST-REF", name: "เสื้อสะท้อนแสงเซฟตี้ Class 2", qty: 50, estimatedUnitCost: 180 },
    ];
    const estimatedTotal = sampleItems.reduce((sum, i) => sum + i.qty * i.estimatedUnitCost, 0);

    return {
      plan,
      proposedAction: {
        actionType: "CREATE_DRAFT_PR",
        resourceType: "PURCHASE_REQUEST",
        inputPayload: {
          projectId,
          items: sampleItems,
          estimatedTotalAmount: estimatedTotal,
          justification: "วัสดุอุปกรณ์ PPE ไม่เพียงพอต่อการเปิดไซต์งานใหม่",
        },
        previewData: {
          title: `สร้างใบขอซื้อ (PR) สำหรับโครงการ ${projectId}`,
          summary: `ขอจัดซื้ออุปกรณ์ PPE 2 รายการ ยอดรวมประมาณ ฿${estimatedTotal.toLocaleString()} เข้าไซต์งาน`,
          affectedRecords: sampleItems.map((item) => ({
            type: "INVENTORY_ITEM",
            id: item.itemCode,
            name: `${item.name} x ${item.qty}`,
          })),
          conflicts: [],
        },
        permissionRequired: "PROCUREMENT_CREATE",
      },
      explanation: `ตรวจพบสต็อก PPE ในคลังโครงการ ${projectId} ต่ำกว่า Safety Stock ได้จัดทำร่างใบขอซื้อ (PR) รวม ฿${estimatedTotal.toLocaleString()} พร้อมส่งให้เจ้าหน้าที่จัดซื้อตรวจสอบและอนุมัติ`,
    };
  },
};

SpecializedAgentRegistry.register(ProcurementAgent);
