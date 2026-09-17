export interface AIUserContext {
  userId?: string;
  email?: string;
  role: string; // ADMIN | EXECUTIVE | HR | SITE_MANAGER | SUPERVISOR | EMPLOYEE
  siteScope?: string[]; // Array of accessible siteIds
  permissions?: string[];
}

export class AIAuthorizationService {
  private static INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /system\s+prompt/i,
    /show\s+prompt/i,
    /reveal\s+instructions/i,
    /\.env/i,
    /execute\s+sql/i,
    /drop\s+table/i,
    /select\s+\*\s+from/i,
    /union\s+select/i,
    /eval\s*\(/i,
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    /bypass\s+(rbac|security|permission)/i,
  ];

  /**
   * 1. Detect malicious prompt injection attacks
   */
  static detectPromptInjection(prompt: string): { isMalicious: boolean; reason?: string } {
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(prompt)) {
        return {
          isMalicious: true,
          reason: `ตรวจพบข้อความที่มีความเสี่ยงด้านความปลอดภัย (รูปแบบ: ${pattern.toString()})`,
        };
      }
    }
    return { isMalicious: false };
  }

  /**
   * 2. Validate tool execution permissions per role
   */
  static checkToolPermission(user: AIUserContext, toolName: string): { allowed: boolean; reason?: string } {
    const role = (user.role || "EMPLOYEE").toUpperCase();

    // ADMIN has access to all tools
    if (role === "ADMIN") {
      return { allowed: true };
    }

    // Role-based tool whitelist
    const permissions: Record<string, string[]> = {
      EXECUTIVE: [
        "getLiveOperations",
        "getSiteStatus",
        "getSiteDetail",
        "getWorkforceForecast",
        "getAttendanceSummary",
        "getAttendanceExceptions",
        "getOTSummary",
        "getLaborCostSummary",
        "getSiteRisk",
        "getOperationsAlerts",
        "getExecutiveDailyBrief",
        "compareSites",
        "runOperationsScenario",
        "getInventorySummary",
        "getLowStockItems",
        "getProjectMaterialStatus",
        "getPurchaseRequestSummary",
        "getPurchaseOrderSummary",
        "getSupplierDeliverySummary",
        "getAssetSummary",
        "getSalesPipelineSummary",
        "getOpportunitySummary",
        "getTenderDeadlines",
        "getEstimateBreakdown",
        "getQuotationStatus",
        "getEstimateVsActual",
        "getRenewalOpportunities",
      ],
      SALES: [
        "getSalesPipelineSummary",
        "getOpportunitySummary",
        "getTenderDeadlines",
        "getQuotationStatus",
        "getRenewalOpportunities",
      ],
      SALES_MANAGER: [
        "getSalesPipelineSummary",
        "getOpportunitySummary",
        "getTenderDeadlines",
        "getEstimateBreakdown",
        "getQuotationStatus",
        "getEstimateVsActual",
        "getRenewalOpportunities",
      ],
      ESTIMATOR: [
        "getOpportunitySummary",
        "getEstimateBreakdown",
        "getEstimateVsActual",
      ],
      COMMERCIAL_MANAGER: [
        "getSalesPipelineSummary",
        "getOpportunitySummary",
        "getTenderDeadlines",
        "getEstimateBreakdown",
        "getQuotationStatus",
        "getEstimateVsActual",
        "getRenewalOpportunities",
      ],
      PROCUREMENT: [
        "getInventorySummary",
        "getLowStockItems",
        "getProjectMaterialStatus",
        "getPurchaseRequestSummary",
        "getPurchaseOrderSummary",
        "getSupplierDeliverySummary",
        "getAssetSummary",
      ],
      WAREHOUSE_STAFF: [
        "getInventorySummary",
        "getLowStockItems",
        "getProjectMaterialStatus",
        "getAssetSummary",
      ],
      HR: [
        "getLiveOperations",
        "getSiteStatus",
        "getSiteDetail",
        "getWorkforceForecast",
        "getAttendanceSummary",
        "getAttendanceExceptions",
        "getOTSummary",
        "getOperationsAlerts",
        "getExecutiveDailyBrief",
      ],
      SITE_MANAGER: [
        "getLiveOperations",
        "getSiteStatus",
        "getSiteDetail",
        "getWorkforceForecast",
        "getAttendanceSummary",
        "getAttendanceExceptions",
        "getOTSummary",
        "getSiteRisk",
        "getOperationsAlerts",
        "runOperationsScenario",
        "getInventorySummary",
        "getLowStockItems",
        "getProjectMaterialStatus",
        "getAssetSummary",
      ],
      SUPERVISOR: [
        "getSiteStatus",
        "getSiteDetail",
        "getWorkforceForecast",
        "getAttendanceSummary",
        "getAttendanceExceptions",
        "getOperationsAlerts",
      ],
      EMPLOYEE: [
        "getSiteStatus",
        "getAttendanceSummary",
      ],
    };

    const allowedTools = permissions[role] || permissions.EMPLOYEE;
    if (!allowedTools.includes(toolName)) {
      return {
        allowed: false,
        reason: `บทบาทผู้ใช้ (${role}) ไม่มีสิทธิ์เรียกใช้เครื่องมือ: ${toolName}`,
      };
    }

    return { allowed: true };
  }

  /**
   * 3. Validate Site Scope constraint
   */
  static checkSiteScope(user: AIUserContext, requestedSiteId?: string): { allowed: boolean; reason?: string } {
    const role = (user.role || "EMPLOYEE").toUpperCase();

    // ADMIN and EXECUTIVE have global site access
    if (role === "ADMIN" || role === "EXECUTIVE") {
      return { allowed: true };
    }

    if (!requestedSiteId) {
      return { allowed: true };
    }

    const scope = user.siteScope || [];
    if (scope.length > 0 && !scope.includes(requestedSiteId)) {
      return {
        allowed: false,
        reason: `คุณไม่มีสิทธิ์เข้าถึงข้อมูลของ Site ID: ${requestedSiteId}`,
      };
    }

    return { allowed: true };
  }

  /**
   * 4. Sanitize tool output to remove sensitive fields and PII before LLM ingestion
   */
  static sanitizeToolOutput(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeToolOutput(item));
    }

    if (typeof data === "object") {
      const sanitized: Record<string, any> = {};
      const forbiddenKeys = [
        "password",
        "passwordHash",
        "idCardNo",
        "bankAccount",
        "bankName",
        "phone",
        "token",
        "secret",
        "lineUserId",
        "2faSecret",
      ];

      for (const [key, value] of Object.entries(data)) {
        if (forbiddenKeys.some((fk) => key.toLowerCase().includes(fk.toLowerCase()))) {
          // Mask sensitive fields
          sanitized[key] = "[PROTECTED]";
        } else if (typeof value === "object" && value !== null) {
          sanitized[key] = this.sanitizeToolOutput(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * 5. Mask sensitive strings (e.g. Thai National ID 13 digits, Bank accounts)
   */
  static maskSensitiveText(text: string): string {
    if (!text) return text;
    // Thai ID: 13 digits (e.g. 1-2345-67890-12-3 or 1234567890123)
    let masked = text.replace(/\b\d{13}\b/g, "XXXXXXXXXXXXX");
    masked = masked.replace(/\b\d{1}-\d{4}-\d{5}-\d{2}-\d{1}\b/g, "X-XXXX-XXXXX-XX-X");
    // Bank account: 10 digits
    masked = masked.replace(/\b\d{10}\b/g, "XXXXXXXXXX");
    return masked;
  }
}
