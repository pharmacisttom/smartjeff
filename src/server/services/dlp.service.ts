import crypto from "crypto";

export interface DlpInspectionResult {
  isClean: boolean;
  redactedCount: number;
  detectedTypes: string[];
  sanitizedData: any;
}

export interface LogChainEntry {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
}

export interface LogIntegrityReport {
  isValid: boolean;
  totalLogsChecked: number;
  tamperedLogId?: string;
  tamperedIndex?: number;
  reason?: string;
  checkedAt: string;
}

// Secret key for HMAC log signature (falls back to a standard deterministic key if env not configured)
const HMAC_SECRET = process.env.DLP_HMAC_SECRET || process.env.AUTH_SECRET || "smartjeff-enterprise-immutable-audit-chain-key-2026";

export class DlpService {
  /**
   * Thai National Citizen ID Card Regex (13 digits, with or without spaces/dashes)
   * Pattern: \b\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1}\b
   */
  private static readonly THAI_ID_REGEX = /\b([0-9]{1})[-.\s]?([0-9]{4})[-.\s]?([0-9]{5})[-.\s]?([0-9]{2})[-.\s]?([0-9]{1})\b/g;

  /**
   * Bank Account Numbers (10 to 12 digits, often formatted as 123-4-56789-0, excluding 06, 08, 09 mobile prefixes)
   */
  private static readonly BANK_ACC_REGEX = /\b(?!0[689])([0-9]{3})[-.\s]?([0-9]{1})[-.\s]?([0-9]{5})[-.\s]?([0-9]{1,3})\b/g;

  /**
   * Thai Mobile Phone Numbers (06, 08, 09 followed by 8 digits)
   */
  private static readonly THAI_PHONE_REGEX = /\b(0[689][0-9])[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g;

  /**
   * Credit / Debit Card Numbers (16 digits in 4 groups of 4)
   */
  private static readonly CREDIT_CARD_REGEX = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;

  /**
   * Sensitive key names that must be immediately redacted in objects
   */
  private static readonly SENSITIVE_KEY_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /authorization/i,
    /cookie/i,
    /mfasecret/i,
    /apikey/i,
    /api_key/i,
    /privatekey/i,
    /creditcard/i,
    /cvv/i,
    /ssn/i,
    /idcardno/i,
    /id_card/i,
  ];

  /**
   * Mask Thai National Citizen ID Card (e.g. 1-1002-00000-89-1 -> 1-1002-*****-89-1)
   */
  static maskThaiCitizenId(idCard: string): string {
    return idCard.replace(this.THAI_ID_REGEX, (_match, g1, g2, _g3, g4, g5) => {
      return `${g1}-${g2}-*****-${g4}-${g5}`;
    });
  }

  /**
   * Mask Bank Account (e.g. 123-4-56789-0 -> 123-x-xxxxx-0)
   */
  static maskBankAccount(bankAccount: string): string {
    return bankAccount.replace(this.BANK_ACC_REGEX, (_match, g1, _g2, _g3, g4) => {
      return `${g1}-x-xxxxx-${g4}`;
    });
  }

  /**
   * Mask Thai Phone Number (e.g. 0812345678 -> 081-xxx-5678)
   */
  static maskPhone(phone: string): string {
    return phone.replace(this.THAI_PHONE_REGEX, (_match, g1, _g2, g3) => {
      return `${g1}-xxx-${g3}`;
    });
  }

  /**
   * Sanitize arbitrary text string by detecting and redacting Thai ID, Bank, Credit Card, and Phones
   */
  static sanitizeText(text: string): { sanitized: string; detectedTypes: string[] } {
    if (!text || typeof text !== "string") return { sanitized: text, detectedTypes: [] };

    const detectedTypes: string[] = [];
    let sanitized = text;

    if (this.THAI_ID_REGEX.test(sanitized)) {
      detectedTypes.push("THAI_CITIZEN_ID");
      sanitized = this.maskThaiCitizenId(sanitized);
    }

    if (this.CREDIT_CARD_REGEX.test(sanitized)) {
      detectedTypes.push("CREDIT_CARD");
      sanitized = sanitized.replace(this.CREDIT_CARD_REGEX, "••••-••••-••••-••••");
    }

    if (this.THAI_PHONE_REGEX.test(sanitized)) {
      detectedTypes.push("PHONE_NUMBER");
      sanitized = this.maskPhone(sanitized);
    }

    if (this.BANK_ACC_REGEX.test(sanitized)) {
      detectedTypes.push("BANK_ACCOUNT");
      sanitized = this.maskBankAccount(sanitized);
    }

    return { sanitized, detectedTypes };
  }

  /**
   * Deep recursive sanitizer for Objects, Arrays, and JSON metadata.
   * Strips passwords/tokens and masks PII in values.
   */
  static sanitize(data: any): any {
    if (data === null || data === undefined) return data;

    if (typeof data === "string") {
      const { sanitized } = this.sanitizeText(data);
      return sanitized;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (typeof data === "object") {
      const result: Record<string, any> = {};

      for (const [key, value] of Object.entries(data)) {
        // 1. Check if the key name itself matches sensitive credentials
        const isSensitiveKey = this.SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));

        if (isSensitiveKey) {
          result[key] = "[REDACTED_BY_DLP]";
          continue;
        }

        // 2. Specific employee / financial sensitive fields
        if (key === "baseSalary" || key === "netPay" || key === "dailyRate") {
          if (typeof value === "number" || typeof value === "string") {
            result[key] = "••••••";
            continue;
          }
        }

        // 3. Recursive sanitize
        result[key] = this.sanitize(value);
      }

      return result;
    }

    return data;
  }

  /**
   * Calculate HMAC-SHA256 hash for a single log entry linked to its previous log hash
   * (Cryptographic Blockchain-style Hash Chaining for Anti-Tampering)
   */
  static computeLogHash(entry: LogChainEntry, previousHash: string = "GENESIS_SMARTJEFF_AUDIT_LOG_2026"): string {
    const rawPayload = [
      previousHash,
      entry.id,
      entry.userId || "SYSTEM",
      entry.action,
      entry.entity,
      entry.entityId || "N/A",
      typeof entry.metadata === "string" ? entry.metadata : JSON.stringify(entry.metadata || {}),
      entry.ipAddress || "127.0.0.1",
      new Date(entry.createdAt).toISOString(),
    ].join("|");

    return crypto.createHmac("sha256", HMAC_SECRET).update(rawPayload).digest("hex");
  }

  /**
   * Verify integrity of an array of audit logs.
   * Traverses logs ordered chronologically (oldest to newest) to verify hash continuity.
   */
  static verifyLogChain(logs: (LogChainEntry & { signatureHash?: string | null })[]): LogIntegrityReport {
    if (!logs || logs.length === 0) {
      return {
        isValid: true,
        totalLogsChecked: 0,
        checkedAt: new Date().toISOString(),
      };
    }

    let previousHash = "GENESIS_SMARTJEFF_AUDIT_LOG_2026";

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const expectedHash = this.computeLogHash(log, previousHash);

      // If the log record stores signatureHash or metadata._signature, verify it
      let recordedHash: string | undefined = log.signatureHash || undefined;

      if (!recordedHash && log.metadata) {
        try {
          const parsed = typeof log.metadata === "string" ? JSON.parse(log.metadata) : log.metadata;
          if (parsed && parsed._dlpSignature) {
            recordedHash = parsed._dlpSignature;
          }
        } catch {
          // ignore json parse error
        }
      }

      if (recordedHash && recordedHash !== expectedHash) {
        return {
          isValid: false,
          totalLogsChecked: i + 1,
          tamperedLogId: log.id,
          tamperedIndex: i,
          reason: `ความสมบูรณ์ของล็อกถูกละเมิด: ล็อก ID ${log.id} มีลายเซ็นไม่ตรงกับค่าคำนวณ (Tamper Detected at Record #${i + 1})`,
          checkedAt: new Date().toISOString(),
        };
      }

      // Chain forward
      previousHash = recordedHash || expectedHash;
    }

    return {
      isValid: true,
      totalLogsChecked: logs.length,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Data Exfiltration Inspection: Checks bulk export volume & parameters
   */
  static inspectExport(params: {
    userId: string;
    resource: string;
    recordCount: number;
    userRole?: string;
  }): { allowed: boolean; riskLevel: "LOW" | "MEDIUM" | "HIGH"; reason?: string } {
    const { recordCount, resource, userRole } = params;

    // High risk: mass download of sensitive payroll/employee data (> 200 rows by non-admin)
    if (recordCount > 200 && userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
      return {
        allowed: false,
        riskLevel: "HIGH",
        reason: `DLP Block: จำนวนข้อมูลที่ขอส่งออก (${recordCount} รายการ) เกินเกณฑ์จำกัดสูงสุดสำหรับบทบาทนี้`,
      };
    }

    if (recordCount > 100) {
      return {
        allowed: true,
        riskLevel: "MEDIUM",
        reason: "DLP Audit: ตรวจพบการดาวน์โหลดข้อมูลปริมาณมาก ระบบบันทึก Watermark นิติวิทยาศาสตร์",
      };
    }

    return {
      allowed: true,
      riskLevel: "LOW",
    };
  }

  /**
   * Generate Forensic Watermark for exported files (Excel/CSV/PDF)
   */
  static generateWatermark(options: {
    userId: string;
    ipAddress?: string;
    tenant?: string;
  }): string {
    const timestamp = new Date().toISOString();
    const traceId = crypto.randomBytes(4).toString("hex").toUpperCase();
    return `CONFIDENTIAL | SMARTJEFF-J2K | EXPORTED BY: ${options.userId} | IP: ${options.ipAddress || "127.0.0.1"} | TS: ${timestamp} | TRACE-${traceId}`;
  }
}
