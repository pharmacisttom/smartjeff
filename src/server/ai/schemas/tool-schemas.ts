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

// Phase 21: Treasury, Reconciliation & Budget
export const ReconciliationSummaryInputSchema = z.object({
  financialAccountId: z.string().optional(),
});

export const UnmatchedBankTransactionsInputSchema = z.object({
  financialAccountId: z.string().optional(),
  limit: z.number().optional().default(20),
});

export const TreasuryPositionInputSchema = z.object({});

export const CashForecast13WeekInputSchema = z.object({
  mode: z.enum(["13-week", "30-day", "calendar"]).optional().default("13-week"),
});

export const BudgetSummaryInputSchema = z.object({
  fiscalYear: z.number().optional(),
});

export const BudgetVarianceInputSchema = z.object({
  fiscalYear: z.number().optional(),
  category: z.string().optional(),
});

export const TreasuryScenarioInputSchema = z.object({
  name: z.string().default("What-If AI Simulation"),
  clientCollectionDelayDays: z.number().optional().default(0),
  supplierPaymentAdvanceDays: z.number().optional().default(0),
  overtimeIncreasePct: z.number().optional().default(0),
  fuelPriceIncreasePct: z.number().optional().default(0),
});

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
export type ReconciliationSummaryInput = z.infer<typeof ReconciliationSummaryInputSchema>;
export type UnmatchedBankTransactionsInput = z.infer<typeof UnmatchedBankTransactionsInputSchema>;
export type TreasuryPositionInput = z.infer<typeof TreasuryPositionInputSchema>;
export type CashForecast13WeekInput = z.infer<typeof CashForecast13WeekInputSchema>;
export type BudgetSummaryInput = z.infer<typeof BudgetSummaryInputSchema>;
export type BudgetVarianceInput = z.infer<typeof BudgetVarianceInputSchema>;
export type TreasuryScenarioInput = z.infer<typeof TreasuryScenarioInputSchema>;

// ==========================================
// Phase 23: Enterprise Automation AI Schemas
// ==========================================

export const AutomationSummaryInputSchema = z.object({});
export type AutomationSummaryInput = z.infer<typeof AutomationSummaryInputSchema>;

export const FailedWorkflowsInputSchema = z.object({
  limit: z.number().int().positive().optional(),
});
export type FailedWorkflowsInput = z.infer<typeof FailedWorkflowsInputSchema>;

export const DeadLetterJobsInputSchema = z.object({
  status: z.string().optional(),
});
export type DeadLetterJobsInput = z.infer<typeof DeadLetterJobsInputSchema>;

export const EventTraceInputSchema = z.object({
  correlationId: z.string().min(1, "correlationId is required"),
});
export type EventTraceInput = z.infer<typeof EventTraceInputSchema>;

export const ExplainWorkflowInputSchema = z.object({
  workflowId: z.string().min(1, "workflowId is required"),
});
export type ExplainWorkflowInput = z.infer<typeof ExplainWorkflowInputSchema>;

export const SimulateRuleInputSchema = z.object({
  ruleId: z.string().min(1, "ruleId is required"),
  sampleData: z.record(z.any()).optional(),
});
export type SimulateRuleInput = z.infer<typeof SimulateRuleInputSchema>;

// ============================================================================
// PHASE 25: PLATFORM RELIABILITY & SRE OBSERVABILITY TOOLS
// ============================================================================

export const GetPlatformHealthInputSchema = z.object({});
export type GetPlatformHealthInput = z.infer<typeof GetPlatformHealthInputSchema>;

export const GetBackupStatusInputSchema = z.object({
  limit: z.number().int().positive().optional(),
});
export type GetBackupStatusInput = z.infer<typeof GetBackupStatusInputSchema>;

export const GetQueueHealthInputSchema = z.object({});
export type GetQueueHealthInput = z.infer<typeof GetQueueHealthInputSchema>;

export const GetWorkerHealthInputSchema = z.object({});
export type GetWorkerHealthInput = z.infer<typeof GetWorkerHealthInputSchema>;

export const GetRecentPlatformIncidentsInputSchema = z.object({
  limit: z.number().int().positive().optional(),
});
export type GetRecentPlatformIncidentsInput = z.infer<typeof GetRecentPlatformIncidentsInputSchema>;

export const GetRpoStatusInputSchema = z.object({});
export type GetRpoStatusInput = z.infer<typeof GetRpoStatusInputSchema>;

export const GetRtoStatusInputSchema = z.object({});
export type GetRtoStatusInput = z.infer<typeof GetRtoStatusInputSchema>;

// ============================================================================
// PHASE 26: AI AGENTIC OPERATIONS & ACTION PROPOSAL SCHEMAS
// ============================================================================

export const DraftWorkforceScheduleInputSchema = z.object({
  siteId: z.string().min(1, "siteId is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)"),
  shiftId: z.string().optional(),
  assignments: z.array(
    z.object({
      userId: z.string().min(1),
      shiftId: z.string().min(1),
      role: z.string().optional(),
    })
  ).optional(),
});
export type DraftWorkforceScheduleInput = z.infer<typeof DraftWorkforceScheduleInputSchema>;

export const DraftPurchaseRequestInputSchema = z.object({
  siteId: z.string().min(1, "siteId is required"),
  department: z.string().optional(),
  reason: z.string().min(1, "reason is required"),
  items: z.array(
    z.object({
      itemId: z.string().min(1),
      quantity: z.number().positive(),
      estimatedUnitPrice: z.number().nonnegative().optional(),
    })
  ).min(1, "at least 1 item is required"),
});
export type DraftPurchaseRequestInput = z.infer<typeof DraftPurchaseRequestInputSchema>;

export const DraftTripInputSchema = z.object({
  originSiteId: z.string().min(1),
  destination: z.string().min(1),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cargoDescription: z.string().optional(),
});
export type DraftTripInput = z.infer<typeof DraftTripInputSchema>;

export const DraftWorkOrderInputSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  assignedUserId: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
});
export type DraftWorkOrderInput = z.infer<typeof DraftWorkOrderInputSchema>;

export const DraftCAPAInputSchema = z.object({
  incidentId: z.string().min(1),
  rootCause: z.string().min(1),
  correctiveAction: z.string().min(1),
  preventiveAction: z.string().optional(),
  responsibleUserId: z.string().optional(),
  targetCompletionDate: z.string().optional(),
});
export type DraftCAPAInput = z.infer<typeof DraftCAPAInputSchema>;

export const DraftCollectionTaskInputSchema = z.object({
  invoiceId: z.string().min(1),
  clientId: z.string().min(1),
  amountDue: z.number().positive(),
  followUpStrategy: z.string().min(1),
  notes: z.string().optional(),
});
export type DraftCollectionTaskInput = z.infer<typeof DraftCollectionTaskInputSchema>;

export const SimulateScenarioInputSchema = z.object({
  scenarioType: z.enum(["WORKFORCE", "FINANCIAL", "MULTI_DOMAIN"]),
  siteId: z.string().optional(),
  deficitDelta: z.number().optional(),
  surplusDelta: z.number().optional(),
  additionalOtHours: z.number().optional(),
  clientCollectionDelayDays: z.number().optional(),
  supplierPaymentAdvanceDays: z.number().optional(),
});
export type SimulateScenarioInput = z.infer<typeof SimulateScenarioInputSchema>;


