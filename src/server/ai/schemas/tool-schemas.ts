import { z } from "zod";

export const LiveOperationsInputSchema = z.object({
  siteScope: z.array(z.string()).optional(),
});

export const SiteStatusInputSchema = z.object({
  siteId: z.string().optional(),
});

export const SiteDetailInputSchema = z.object({
  siteId: z.string().min(1, "siteId is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
});

export const WorkforceForecastInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
  siteId: z.string().optional(),
});

export const AttendanceSummaryInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
  siteId: z.string().optional(),
});

export const AttendanceExceptionsInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
  siteId: z.string().optional(),
});

export const OTSummaryInputSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Invalid period format (YYYY-MM)").optional(),
  siteId: z.string().optional(),
});

export const LaborCostSummaryInputSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Invalid period format (YYYY-MM)").optional(),
  siteId: z.string().optional(),
});

export const SiteRiskInputSchema = z.object({
  siteId: z.string().optional(),
});

export const OperationsAlertsInputSchema = z.object({
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL", "INFO", "WARNING"]).optional(),
  status: z.enum(["ACTIVE", "ACKNOWLEDGED", "RESOLVED", "SUPPRESSED"]).optional(),
  siteId: z.string().optional(),
});

export const ExecutiveDailyBriefInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
});

export const CompareSitesInputSchema = z.object({
  siteIdA: z.string().min(1, "siteIdA is required"),
  siteIdB: z.string().min(1, "siteIdB is required"),
  period: z.string().optional(),
});

export const OperationsScenarioInputSchema = z.object({
  siteId: z.string().min(1, "siteId is required"),
  deficitDelta: z.number().int().min(0).max(100).optional().default(0),
  surplusDelta: z.number().int().min(0).max(100).optional().default(0),
  additionalOtHours: z.number().min(0).max(1000).optional().default(0),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)").optional(),
});

// Phase 16: Procurement, Inventory & Asset Tool Schemas
export const InventorySummaryInputSchema = z.object({
  warehouseId: z.string().optional(),
});

export const LowStockItemsInputSchema = z.object({
  limit: z.number().int().optional().default(10),
});

export const ProjectMaterialStatusInputSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
});

export const PurchaseRequestSummaryInputSchema = z.object({
  status: z.string().optional(),
  projectId: z.string().optional(),
});

export const PurchaseOrderSummaryInputSchema = z.object({
  status: z.string().optional(),
  supplierId: z.string().optional(),
  projectId: z.string().optional(),
});

export const SupplierDeliverySummaryInputSchema = z.object({
  supplierId: z.string().optional(),
});

export const AssetSummaryInputSchema = z.object({
  siteId: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
});

// Phase 17: CRM, Sales & Estimation Schemas
export const SalesPipelineSummaryInputSchema = z.object({});

export const OpportunitySummaryInputSchema = z.object({
  opportunityId: z.string().min(1, "opportunityId is required"),
});

export const TenderDeadlinesInputSchema = z.object({
  daysThreshold: z.number().optional().default(14),
});

export const EstimateBreakdownInputSchema = z.object({
  estimateId: z.string().min(1, "estimateId is required"),
});

export const QuotationStatusInputSchema = z.object({
  quotationId: z.string().min(1, "quotationId is required"),
});

export const EstimateVsActualInputSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
});

export const RenewalOpportunitiesInputSchema = z.object({
  daysThreshold: z.number().optional().default(90),
});

// Phase 18: QHSE Schemas
export const QHSESummaryInputSchema = z.object({
  siteId: z.string().optional(),
});

export const OpenIncidentsInputSchema = z.object({
  siteId: z.string().optional(),
  severity: z.string().optional(),
});

export const CAPAStatusInputSchema = z.object({
  isOverdueOnly: z.boolean().optional(),
});

export const RiskRegisterSummaryInputSchema = z.object({
  siteId: z.string().optional(),
  projectId: z.string().optional(),
});

export const ComplianceSummaryInputSchema = z.object({});

export const ExpiringCertificatesInputSchema = z.object({
  daysThreshold: z.number().optional().default(30),
});

export const AuditSummaryInputSchema = z.object({});

export type LiveOperationsInput = z.infer<typeof LiveOperationsInputSchema>;
export type SiteStatusInput = z.infer<typeof SiteStatusInputSchema>;
export type SiteDetailInput = z.infer<typeof SiteDetailInputSchema>;
export type WorkforceForecastInput = z.infer<typeof WorkforceForecastInputSchema>;
export type AttendanceSummaryInput = z.infer<typeof AttendanceSummaryInputSchema>;
export type AttendanceExceptionsInput = z.infer<typeof AttendanceExceptionsInputSchema>;
export type OTSummaryInput = z.infer<typeof OTSummaryInputSchema>;
export type LaborCostSummaryInput = z.infer<typeof LaborCostSummaryInputSchema>;
export type SiteRiskInput = z.infer<typeof SiteRiskInputSchema>;
export type OperationsAlertsInput = z.infer<typeof OperationsAlertsInputSchema>;
export type ExecutiveDailyBriefInput = z.infer<typeof ExecutiveDailyBriefInputSchema>;
export type CompareSitesInput = z.infer<typeof CompareSitesInputSchema>;
export type OperationsScenarioInput = z.infer<typeof OperationsScenarioInputSchema>;
export type InventorySummaryInput = z.infer<typeof InventorySummaryInputSchema>;
export type LowStockItemsInput = z.infer<typeof LowStockItemsInputSchema>;
export type ProjectMaterialStatusInput = z.infer<typeof ProjectMaterialStatusInputSchema>;
export type PurchaseRequestSummaryInput = z.infer<typeof PurchaseRequestSummaryInputSchema>;
export type PurchaseOrderSummaryInput = z.infer<typeof PurchaseOrderSummaryInputSchema>;
export type SupplierDeliverySummaryInput = z.infer<typeof SupplierDeliverySummaryInputSchema>;
export type AssetSummaryInput = z.infer<typeof AssetSummaryInputSchema>;
export type SalesPipelineSummaryInput = z.infer<typeof SalesPipelineSummaryInputSchema>;
export type OpportunitySummaryInput = z.infer<typeof OpportunitySummaryInputSchema>;
export type TenderDeadlinesInput = z.infer<typeof TenderDeadlinesInputSchema>;
export type EstimateBreakdownInput = z.infer<typeof EstimateBreakdownInputSchema>;
export type QuotationStatusInput = z.infer<typeof QuotationStatusInputSchema>;
export type EstimateVsActualInput = z.infer<typeof EstimateVsActualInputSchema>;
export type RenewalOpportunitiesInput = z.infer<typeof RenewalOpportunitiesInputSchema>;
export type QHSESummaryInput = z.infer<typeof QHSESummaryInputSchema>;
export type OpenIncidentsInput = z.infer<typeof OpenIncidentsInputSchema>;
export type CAPAStatusInput = z.infer<typeof CAPAStatusInputSchema>;
export type RiskRegisterSummaryInput = z.infer<typeof RiskRegisterSummaryInputSchema>;
export type ComplianceSummaryInput = z.infer<typeof ComplianceSummaryInputSchema>;
export type ExpiringCertificatesInput = z.infer<typeof ExpiringCertificatesInputSchema>;
export type AuditSummaryInput = z.infer<typeof AuditSummaryInputSchema>;

