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
