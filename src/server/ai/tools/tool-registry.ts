import { z } from "zod";
import { OperationsIntelligenceService } from "@/server/services/operations-intelligence.service";
import { OperationsScenarioService } from "@/server/services/operations-scenario.service";
import { StockMovementService } from "@/server/services/inventory/stock-movement.service";
import { ItemService } from "@/server/services/inventory/item.service";
import { MaterialRequirementService } from "@/server/services/inventory/material-requirement.service";
import { PurchaseRequestService } from "@/server/services/procurement/purchase-request.service";
import { PurchaseOrderService } from "@/server/services/procurement/purchase-order.service";
import { SupplierService } from "@/server/services/procurement/supplier.service";
import { AssetService } from "@/server/services/inventory/asset.service";
import { OpportunityService } from "@/server/services/crm/opportunity.service";
import { TenderService } from "@/server/services/crm/tender.service";
import { EstimationService } from "@/server/services/crm/estimation.service";
import { QuotationService } from "@/server/services/crm/quotation.service";
import { EstimationAccuracyService } from "@/server/services/crm/estimation-accuracy.service";
import { IncidentService } from "@/server/services/qhse/incident.service";
import { CAPAService } from "@/server/services/qhse/capa.service";
import { RiskManagementService } from "@/server/services/qhse/risk-management.service";
import { ComplianceService } from "@/server/services/qhse/compliance.service";
import { TrainingCertificationService } from "@/server/services/qhse/training-certification.service";
import { AuditService } from "@/server/services/qhse/audit.service";
import { QHSERiskIntelligenceService } from "@/server/services/qhse/qhse-risk-intelligence.service";
import { prisma } from "@/lib/prisma";
import { AIAuthorizationService, AIUserContext } from "../security/ai-authorization.service";
import * as schemas from "../schemas/tool-schemas";

export interface AIToolDefinition<T = any> {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<T>;
  permissionRequirement: string;
  auditCategory: string;
  handler: (input: T, userContext: AIUserContext) => Promise<any>;
}

export class AIOperationsToolRegistry {
  private static tools: Map<string, AIToolDefinition> = new Map();

  static initialize() {
    if (this.tools.size > 0) return;

    // 1. getLiveOperations
    this.register({
      name: "getLiveOperations",
      description: "ดึงข้อมูลสถานะการปฏิบัติงานสดทุกไซต์งาน (จำนวนคนทำงาน, ขาด, ลา, มาสาย, OT, Alert)",
      inputSchema: schemas.LiveOperationsInputSchema,
      permissionRequirement: "OPERATIONS_VIEW",
      auditCategory: "LIVE_OPERATIONS",
      handler: async (input, user) => {
        return OperationsIntelligenceService.getLiveOperations(user.siteScope);
      },
    });

    // 2. getSiteStatus
    this.register({
      name: "getSiteStatus",
      description: "ดึงสถานะสรุปของไซต์งานเฉพาะเจาะจง หรือสถานะรวม",
      inputSchema: schemas.SiteStatusInputSchema,
      permissionRequirement: "OPERATIONS_VIEW",
      auditCategory: "LIVE_OPERATIONS",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return OperationsIntelligenceService.getSiteStatus(input.siteId, user.siteScope);
      },
    });

    // 3. getSiteDetail
    this.register({
      name: "getSiteDetail",
      description: "ดึงข้อมูลเชิงลึกของไซต์งานพร้อมรายชื่อพนักงานที่ลงเวลา (ข้อมูลผ่านการ Masking)",
      inputSchema: schemas.SiteDetailInputSchema,
      permissionRequirement: "SITE_DETAIL_VIEW",
      auditCategory: "WORKFORCE",
      handler: async (input, user) => {
        const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
        if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        return OperationsIntelligenceService.getSiteDetail(input.siteId, input.date);
      },
    });

    // 4. getWorkforceForecast
    this.register({
      name: "getWorkforceForecast",
      description: "ดึงข้อมูลคาดการณ์ความต้องการกำลังพลและการขาดแคลนกำลังคนตามไซต์งาน",
      inputSchema: schemas.WorkforceForecastInputSchema,
      permissionRequirement: "FORECAST_VIEW",
      auditCategory: "FORECAST",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return OperationsIntelligenceService.getWorkforceForecast(input.date, input.siteId, user.siteScope);
      },
    });

    // 5. getAttendanceSummary
    this.register({
      name: "getAttendanceSummary",
      description: "ดึงข้อมูลสรุปการลงเวลาเข้า-ออกงานและอัตราการลงเวลา",
      inputSchema: schemas.AttendanceSummaryInputSchema,
      permissionRequirement: "ATTENDANCE_VIEW",
      auditCategory: "ATTENDANCE",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return OperationsIntelligenceService.getAttendanceSummary(input.date, input.siteId, user.siteScope);
      },
    });

    // 6. getAttendanceExceptions
    this.register({
      name: "getAttendanceExceptions",
      description: "ดึงรายการข้อยกเว้นและข้อผิดปกติการลงเวลา เช่น ลงเวลานอก Geofence",
      inputSchema: schemas.AttendanceExceptionsInputSchema,
      permissionRequirement: "ATTENDANCE_VIEW",
      auditCategory: "ATTENDANCE",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return OperationsIntelligenceService.getAttendanceExceptions(input.date, input.siteId, user.siteScope);
      },
    });

    // 7. getOTSummary
    this.register({
      name: "getOTSummary",
      description: "ดึงข้อมูลสรุปชั่วโมงและมูลค่าการทำงานล่วงเวลา (OT) แยกตามงวดและไซต์",
      inputSchema: schemas.OTSummaryInputSchema,
      permissionRequirement: "OT_VIEW",
      auditCategory: "OT",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return OperationsIntelligenceService.getOTSummary(input.period, input.siteId, user.siteScope);
      },
    });

    // 8. getLaborCostSummary
    this.register({
      name: "getLaborCostSummary",
      description: "ดึงข้อมูลสรุปต้นทุนค่าแรงภาพรวมองค์กรหรือไซต์งาน (ไม่เปิดเผยข้อมูลเงินเดือนส่วนบุคคล)",
      inputSchema: schemas.LaborCostSummaryInputSchema,
      permissionRequirement: "COST_VIEW",
      auditCategory: "LABOR_COST",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return OperationsIntelligenceService.getLaborCostSummary(input.period, input.siteId, user.siteScope);
      },
    });

    // 9. getSiteRisk
    this.register({
      name: "getSiteRisk",
      description: "ดึงรายงานประเมินระดับความเสี่ยงของไซต์งาน (กำลังคนไม่พอ, ขาดหัวหน้างาน)",
      inputSchema: schemas.SiteRiskInputSchema,
      permissionRequirement: "RISK_VIEW",
      auditCategory: "RISK",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return OperationsIntelligenceService.getSiteRisk(input.siteId, user.siteScope);
      },
    });

    // 10. getOperationsAlerts
    this.register({
      name: "getOperationsAlerts",
      description: "ดึงรายการแจ้งเตือนปฏิบัติการที่ยัง Active หรือตามระดับความรุนแรง",
      inputSchema: schemas.OperationsAlertsInputSchema,
      permissionRequirement: "ALERT_VIEW",
      auditCategory: "ALERTS",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return OperationsIntelligenceService.getOperationsAlerts(
          input.severity,
          input.status,
          input.siteId,
          user.siteScope
        );
      },
    });

    // 11. getExecutiveDailyBrief
    this.register({
      name: "getExecutiveDailyBrief",
      description: "ดึงข้อมูลสรุปผู้บริหารประจำวัน (Executive Morning/Daily Operations Brief)",
      inputSchema: schemas.ExecutiveDailyBriefInputSchema,
      permissionRequirement: "EXECUTIVE_BRIEF_VIEW",
      auditCategory: "EXECUTIVE_BRIEF",
      handler: async (input) => {
        return OperationsIntelligenceService.getExecutiveDailyBrief(input.date);
      },
    });

    // 12. compareSites
    this.register({
      name: "compareSites",
      description: "เปรียบเทียบข้อมูลปฏิบัติการและกำลังพลระหว่าง 2 ไซต์งาน",
      inputSchema: schemas.CompareSitesInputSchema,
      permissionRequirement: "SITE_COMPARE_VIEW",
      auditCategory: "SITE_COMPARISON",
      handler: async (input, user) => {
        const scopeA = AIAuthorizationService.checkSiteScope(user, input.siteIdA);
        const scopeB = AIAuthorizationService.checkSiteScope(user, input.siteIdB);
        if (!scopeA.allowed) throw new Error(scopeA.reason);
        if (!scopeB.allowed) throw new Error(scopeB.reason);
        return OperationsIntelligenceService.compareSites(input.siteIdA, input.siteIdB, input.period);
      },
    });

    // 13. runOperationsScenario
    this.register({
      name: "runOperationsScenario",
      description: "จำลองสถานการณ์ What-if เช่น หากไซต์ขาดคนเพิ่ม 5 คน จะส่งผลต่อความเสี่ยงและ OT อย่างไร (Read-only simulation)",
      inputSchema: schemas.OperationsScenarioInputSchema,
      permissionRequirement: "SCENARIO_SIMULATE",
      auditCategory: "SCENARIO",
      handler: async (input, user) => {
        const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
        if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        return OperationsScenarioService.runScenario(input);
      },
    });

    // 14. getInventorySummary (Phase 16)
    this.register({
      name: "getInventorySummary",
      description: "ดึงข้อมูลสรุปภาพรวมคลังสินค้า มูลค่าสต็อกรวม และจำนวนสินค้าใกล้หมด/หมดคลัง",
      inputSchema: schemas.InventorySummaryInputSchema,
      permissionRequirement: "OPERATIONS_VIEW",
      auditCategory: "INVENTORY",
      handler: async () => {
        return StockMovementService.getInventorySummary();
      },
    });

    // 15. getLowStockItems (Phase 16)
    this.register({
      name: "getLowStockItems",
      description: "ดึงรายการสินค้าที่สต็อกต่ำกว่าจุดสั่งซื้อซ้ำ (Reorder Point) หรือหมดคลัง",
      inputSchema: schemas.LowStockItemsInputSchema,
      permissionRequirement: "OPERATIONS_VIEW",
      auditCategory: "INVENTORY",
      handler: async () => {
        return ItemService.getLowStockItems();
      },
    });

    // 16. getProjectMaterialStatus (Phase 16)
    this.register({
      name: "getProjectMaterialStatus",
      description: "ตรวจสอบความต้องการใช้วัสดุและรายการที่ขาดแคลน (Shortage) ของโครงการ",
      inputSchema: schemas.ProjectMaterialStatusInputSchema,
      permissionRequirement: "OPERATIONS_VIEW",
      auditCategory: "MATERIAL_PLANNING",
      handler: async (input) => {
        return MaterialRequirementService.getRequirements({ projectId: input.projectId });
      },
    });

    // 17. getPurchaseRequestSummary (Phase 16)
    this.register({
      name: "getPurchaseRequestSummary",
      description: "สรุปรายการใบขอซื้อ (PR) ค้างอนุมัติหรือจำแนกตามโครงการ",
      inputSchema: schemas.PurchaseRequestSummaryInputSchema,
      permissionRequirement: "OPERATIONS_VIEW",
      auditCategory: "PROCUREMENT",
      handler: async (input) => {
        return PurchaseRequestService.getPRs({ status: input.status, projectId: input.projectId });
      },
    });

    // 18. getPurchaseOrderSummary (Phase 16)
    this.register({
      name: "getPurchaseOrderSummary",
      description: "สรุปใบสั่งซื้อ (PO) สถานะเปิดอยู่ ยอดเงินรวม และกำหนดส่งมอบ",
      inputSchema: schemas.PurchaseOrderSummaryInputSchema,
      permissionRequirement: "OPERATIONS_VIEW",
      auditCategory: "PROCUREMENT",
      handler: async (input) => {
        return PurchaseOrderService.getPOs({ status: input.status, supplierId: input.supplierId, projectId: input.projectId });
      },
    });

    // 19. getSupplierDeliverySummary (Phase 16)
    this.register({
      name: "getSupplierDeliverySummary",
      description: "สรุปสถิติและประสิทธิภาพการส่งมอบสินค้าของผู้จำหน่าย (On-time Rate, Delay Days)",
      inputSchema: schemas.SupplierDeliverySummaryInputSchema,
      permissionRequirement: "OPERATIONS_VIEW",
      auditCategory: "PROCUREMENT",
      handler: async (input) => {
        return SupplierService.getSupplierDeliveryMetrics(input.supplierId);
      },
    });

    // 20. getAssetSummary (Phase 16)
    this.register({
      name: "getAssetSummary",
      description: "สรุปรายการทรัพย์สินและเครื่องมือ อุปกรณ์ที่กำลังใช้งาน และการตรวจสภาพ",
      inputSchema: schemas.AssetSummaryInputSchema,
      permissionRequirement: "OPERATIONS_VIEW",
      auditCategory: "ASSET",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return AssetService.getAssets({ siteId: input.siteId, category: input.category, status: input.status });
      },
    });

    // 21. getSalesPipelineSummary (Phase 17)
    this.register({
      name: "getSalesPipelineSummary",
      description: "สรุปภาพรวม Sales Pipeline, มูลค่างานทั้งหมด และจำนวนโอกาสการขายในแต่ละ Stage",
      inputSchema: schemas.SalesPipelineSummaryInputSchema,
      permissionRequirement: "SALES_VIEW",
      auditCategory: "CRM",
      handler: async () => {
        return OpportunityService.getPipelineSummary();
      },
    });

    // 22. getOpportunitySummary (Phase 17)
    this.register({
      name: "getOpportunitySummary",
      description: "ดึงรายละเอียดของโอกาสการขาย (Opportunity) รวมถึง Requirements, ผลสำรวจ และสถานะใบเสนอราคา",
      inputSchema: schemas.OpportunitySummaryInputSchema,
      permissionRequirement: "SALES_VIEW",
      auditCategory: "CRM",
      handler: async (input) => {
        return OpportunityService.getOpportunityById(input.opportunityId);
      },
    });

    // 23. getTenderDeadlines (Phase 17)
    this.register({
      name: "getTenderDeadlines",
      description: "ตรวจสอบงานประมูล (Tender) ที่ใกล้ถึงกำหนดส่งข้อเสนอ (เช่น 14, 7, 3, 1 วัน)",
      inputSchema: schemas.TenderDeadlinesInputSchema,
      permissionRequirement: "SALES_VIEW",
      auditCategory: "TENDER",
      handler: async (input) => {
        return TenderService.getTenderDeadlines(input.daysThreshold);
      },
    });

    // 24. getEstimateBreakdown (Phase 17)
    this.register({
      name: "getEstimateBreakdown",
      description: "แจกแจงรายละเอียดต้นทุนประมาณการ (แรงงาน, OT, ยานพาหนะ, วัสดุ, โสหุ้ย, สำรองความเสี่ยง)",
      inputSchema: schemas.EstimateBreakdownInputSchema,
      permissionRequirement: "ESTIMATE_VIEW",
      auditCategory: "ESTIMATION",
      handler: async (input) => {
        return EstimationService.getEstimateById(input.estimateId);
      },
    });

    // 25. getQuotationStatus (Phase 17)
    this.register({
      name: "getQuotationStatus",
      description: "ตรวจสอบสถานะและเวอร์ชันของใบเสนอราคา (Quotation) รวมถึงยอดรวมและเงื่อนไขทางการค้า",
      inputSchema: schemas.QuotationStatusInputSchema,
      permissionRequirement: "SALES_VIEW",
      auditCategory: "COMMERCIAL",
      handler: async (input) => {
        return QuotationService.getQuotationById(input.quotationId);
      },
    });

    // 26. getEstimateVsActual (Phase 17)
    this.register({
      name: "getEstimateVsActual",
      description: "เปรียบเทียบต้นทุนประมาณการก่อนขายกับต้นทุนจริงหลังดำเนินงานของโครงการ (Labor, Fleet, Material, Total)",
      inputSchema: schemas.EstimateVsActualInputSchema,
      permissionRequirement: "ESTIMATE_VIEW",
      auditCategory: "COMMERCIAL_LEARNING",
      handler: async (input) => {
        return EstimationAccuracyService.getProjectEstimateVsActual(input.projectId);
      },
    });

    // 27. getRenewalOpportunities (Phase 17)
    this.register({
      name: "getRenewalOpportunities",
      description: "ค้นหาสัญญาว่าจ้าง (Contracts) ที่ใกล้หมดอายุภายใน 90, 60, 30 วันเพื่อเตรียมการต่อสัญญาใหม่",
      inputSchema: schemas.RenewalOpportunitiesInputSchema,
      permissionRequirement: "SALES_VIEW",
      auditCategory: "CRM_RENEWAL",
      handler: async (input) => {
        const thresholdDays = input.daysThreshold || 90;
        const now = new Date();
        const maxDate = new Date();
        maxDate.setDate(now.getDate() + thresholdDays);

        const expiringContracts = await prisma.contract.findMany({
          where: {
            status: "ACTIVE",
            endDate: { gte: now, lte: maxDate },
          },
          include: {
            client: { select: { id: true, name: true, contactName: true, contactPhone: true } },
            project: { select: { id: true, projectCode: true, name: true } },
          },
          orderBy: { endDate: "asc" },
        });

        return expiringContracts.map((c) => {
          const daysLeft = Math.ceil((new Date(c.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            ...c,
            daysRemaining: daysLeft,
            urgency: daysLeft <= 30 ? "HIGH" : daysLeft <= 60 ? "MEDIUM" : "LOW",
          };
        });
      },
    });

    // 27. getQHSESummary
    this.register({
      name: "getQHSESummary",
      description: "ดึงภาพรวมสถิติและความเสี่ยง QHSE (อุบัติการณ์, Near Miss, CAPA เกินกำหนด, Risk ระดับสูง, Gap มาตรฐาน)",
      inputSchema: schemas.QHSESummaryInputSchema,
      permissionRequirement: "QHSE_VIEW",
      auditCategory: "QHSE",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return QHSERiskIntelligenceService.getExecutiveMetrics(input.siteId);
      },
    });

    // 28. getOpenIncidents
    this.register({
      name: "getOpenIncidents",
      description: "ดึงรายการอุบัติการณ์และเหตุการณ์ด้านความปลอดภัยที่ยังเปิดอยู่",
      inputSchema: schemas.OpenIncidentsInputSchema,
      permissionRequirement: "QHSE_VIEW",
      auditCategory: "QHSE",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return IncidentService.getIncidents({
          siteId: input.siteId,
          severity: input.severity,
          status: "REPORTED",
          take: 20,
        });
      },
    });

    // 29. getCAPAStatus
    this.register({
      name: "getCAPAStatus",
      description: "ดึงสถานะมาตรการแก้ไขและป้องกัน (CAPA) รวมถึงรายการที่เกินกำหนดเวลา (Overdue)",
      inputSchema: schemas.CAPAStatusInputSchema,
      permissionRequirement: "QHSE_VIEW",
      auditCategory: "QHSE",
      handler: async (input, _user) => {
        return CAPAService.getCAPAs({
          isOverdueOnly: input.isOverdueOnly,
          take: 25,
        });
      },
    });

    // 30. getRiskRegisterSummary
    this.register({
      name: "getRiskRegisterSummary",
      description: "ดึงสรุปทะเบียนความเสี่ยงองค์กรและระดับไซต์งาน พร้อม Inherent vs Residual Risk",
      inputSchema: schemas.RiskRegisterSummaryInputSchema,
      permissionRequirement: "RISK_VIEW",
      auditCategory: "RISK",
      handler: async (input, user) => {
        if (input.siteId) {
          const scopeCheck = AIAuthorizationService.checkSiteScope(user, input.siteId);
          if (!scopeCheck.allowed) throw new Error(scopeCheck.reason);
        }
        return RiskManagementService.getRiskSummary(input.siteId, input.projectId);
      },
    });

    // 31. getComplianceSummary
    this.register({
      name: "getComplianceSummary",
      description: "ดึงภาพรวมความสอดคล้องตามข้อกำหนดกฎหมาย สัญญา และนโยบาย พร้อม Compliance Gaps",
      inputSchema: schemas.ComplianceSummaryInputSchema,
      permissionRequirement: "COMPLIANCE_VIEW",
      auditCategory: "COMPLIANCE",
      handler: async (_input, _user) => {
        return ComplianceService.getComplianceSummary();
      },
    });

    // 32. getExpiringCertificates
    this.register({
      name: "getExpiringCertificates",
      description: "ดึงรายชื่อใบอนุญาต/วุฒิบัตร/ใบรับรองของพนักงานที่ใกล้หมดอายุหรือหมดอายุแล้ว",
      inputSchema: schemas.ExpiringCertificatesInputSchema,
      permissionRequirement: "TRAINING_VIEW",
      auditCategory: "TRAINING",
      handler: async (input, _user) => {
        return TrainingCertificationService.getExpiringCertifications(input.daysThreshold || 30);
      },
    });

    // 33. getAuditSummary
    this.register({
      name: "getAuditSummary",
      description: "ดึงสถานะแผนการตรวจประเมิน QHSE (Audit Programs) และผลการตรวจประเมิน",
      inputSchema: schemas.AuditSummaryInputSchema,
      permissionRequirement: "AUDIT_VIEW",
      auditCategory: "AUDIT",
      handler: async (_input, _user) => {
        return AuditService.getAuditSummary();
      },
    });
  }

  static register<T>(tool: AIToolDefinition<T>) {
    this.tools.set(tool.name, tool);
  }

  static getTool(name: string): AIToolDefinition | undefined {
    this.initialize();
    return this.tools.get(name);
  }

  static listTools(): Array<{ name: string; description: string; auditCategory: string }> {
    this.initialize();
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      auditCategory: t.auditCategory,
    }));
  }

  /**
   * Execute tool safely with Zod validation, RBAC check, and output sanitization
   */
  static async executeTool(toolName: string, rawInput: any, user: AIUserContext): Promise<any> {
    this.initialize();
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`ไม่อนุญาตให้เรียกใช้เครื่องมือ: "${toolName}" (ไม่พบใน Approved Tool Registry)`);
    }

    // 1. RBAC Check
    const permCheck = AIAuthorizationService.checkToolPermission(user, toolName);
    if (!permCheck.allowed) {
      throw new Error(permCheck.reason || "คุณไม่มีสิทธิ์เรียกใช้เครื่องมือนี้");
    }

    // 2. Zod Validation
    const validatedInput = tool.inputSchema.parse(rawInput || {});

    // 3. Execution
    const rawResult = await tool.handler(validatedInput, user);

    // 4. Output Sanitization & PII Masking
    return AIAuthorizationService.sanitizeToolOutput(rawResult);
  }
}
