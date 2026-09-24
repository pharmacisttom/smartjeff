import { describe, it, expect } from "vitest";
import { DlpService, type LogChainEntry } from "./dlp.service";

describe("SMARTJEFF — Data Loss Prevention (DLP) & Anti-Tampering Engine Tests", () => {
  describe("1. Thai PII & Citizen ID Masking", () => {
    it("should mask 13-digit Thai National Citizen ID in standard dashed format", () => {
      const raw = "พนักงานเลขบัตร 1-5099-00123-45-6 ปฏิบัติงานประจำไซต์";
      const { sanitized, detectedTypes } = DlpService.sanitizeText(raw);
      expect(sanitized).toBe("พนักงานเลขบัตร 1-5099-*****-45-6 ปฏิบัติงานประจำไซต์");
      expect(detectedTypes).toContain("THAI_CITIZEN_ID");
    });

    it("should mask 13-digit Thai Citizen ID in continuous digit format", () => {
      const raw = "Citizen ID: 1509900123456 verified.";
      const { sanitized, detectedTypes } = DlpService.sanitizeText(raw);
      expect(sanitized).toContain("1-5099-*****-45-6");
      expect(detectedTypes).toContain("THAI_CITIZEN_ID");
    });

    it("should mask Bank Account numbers to protect financial privacy", () => {
      const raw = "โอนเงินเข้าบัญชี 123-4-56789-0 ธนาคารกสิกรไทย";
      const { sanitized, detectedTypes } = DlpService.sanitizeText(raw);
      expect(sanitized).toContain("123-x-xxxxx-0");
      expect(detectedTypes).toContain("BANK_ACCOUNT");
    });

    it("should mask Thai mobile phone numbers", () => {
      const raw = "ติดต่อเบอร์ 0812345678 หรือ 0951112233";
      const { sanitized, detectedTypes } = DlpService.sanitizeText(raw);
      expect(sanitized).toContain("081-xxx-5678");
      expect(sanitized).toContain("095-xxx-2233");
      expect(detectedTypes).toContain("PHONE_NUMBER");
    });
  });

  describe("2. Deep Recursive Object & Credential Sanitization", () => {
    it("should strip sensitive credentials (password, token, secrets) recursively", () => {
      const dirtyPayload = {
        user: "admin@smartjeff.com",
        password: "SuperSecretPassword123!",
        nested: {
          authToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret",
          mfaSecret: "JBSWY3DPEHPK3PXP",
          safeNote: "ปกติทั่วไป",
          idCardNo: "1-1002-00000-89-1",
        },
        financials: {
          baseSalary: 45000,
          netPay: 42000,
        },
      };

      const clean = DlpService.sanitize(dirtyPayload);

      // Credentials should be redacted
      expect(clean.password).toBe("[REDACTED_BY_DLP]");
      expect(clean.nested.authToken).toBe("[REDACTED_BY_DLP]");
      expect(clean.nested.mfaSecret).toBe("[REDACTED_BY_DLP]");
      expect(clean.nested.idCardNo).toBe("[REDACTED_BY_DLP]");

      // Financials should be masked in log contexts
      expect(clean.financials.baseSalary).toBe("••••••");
      expect(clean.financials.netPay).toBe("••••••");

      // Normal fields should remain intact
      expect(clean.user).toBe("admin@smartjeff.com");
      expect(clean.nested.safeNote).toBe("ปกติทั่วไป");
    });

    it("should handle arrays of objects seamlessly", () => {
      const list = [
        { name: "John", phone: "0891234567" },
        { name: "Jane", password: "123456password" },
      ];

      const clean = DlpService.sanitize(list);
      expect(clean[0].phone).toBe("089-xxx-4567");
      expect(clean[1].password).toBe("[REDACTED_BY_DLP]");
    });
  });

  describe("3. Cryptographic Audit Log Anti-Tampering Chain", () => {
    const createSampleChain = (): (LogChainEntry & { signatureHash: string })[] => {
      const log1: LogChainEntry = {
        id: "log-001",
        userId: "user-1",
        action: "USER_LOGIN",
        entity: "UserSession",
        metadata: JSON.stringify({ ip: "192.168.1.1" }),
        createdAt: new Date("2026-09-24T08:00:00Z"),
      };
      const hash1 = DlpService.computeLogHash(log1, "GENESIS_SMARTJEFF_AUDIT_LOG_2026");

      const log2: LogChainEntry = {
        id: "log-002",
        userId: "user-1",
        action: "PAYROLL_APPROVE",
        entity: "PayrollRun",
        metadata: JSON.stringify({ period: "2026-09", count: 152 }),
        createdAt: new Date("2026-09-24T08:30:00Z"),
      };
      const hash2 = DlpService.computeLogHash(log2, hash1);

      const log3: LogChainEntry = {
        id: "log-003",
        userId: "user-2",
        action: "ROLE_PERMISSION_UPDATE",
        entity: "Role",
        metadata: JSON.stringify({ role: "SUPERVISOR", added: ["attendance.approve"] }),
        createdAt: new Date("2026-09-24T09:00:00Z"),
      };
      const hash3 = DlpService.computeLogHash(log3, hash2);

      return [
        { ...log1, signatureHash: hash1 },
        { ...log2, signatureHash: hash2 },
        { ...log3, signatureHash: hash3 },
      ];
    };

    it("should verify valid cryptographic log chain with 100% integrity", () => {
      const chain = createSampleChain();
      const report = DlpService.verifyLogChain(chain);

      expect(report.isValid).toBe(true);
      expect(report.totalLogsChecked).toBe(3);
      expect(report.tamperedLogId).toBeUndefined();
    });

    it("should instantly detect tampered metadata in an audit log entry", () => {
      const chain = createSampleChain();

      // Malicious modification of log #2: altering count from 152 to 999
      chain[1].metadata = JSON.stringify({ period: "2026-09", count: 999 });

      const report = DlpService.verifyLogChain(chain);
      expect(report.isValid).toBe(false);
      expect(report.tamperedLogId).toBe("log-002");
      expect(report.tamperedIndex).toBe(1);
      expect(report.reason).toContain("ความสมบูรณ์ของล็อกถูกละเมิด");
    });

    it("should detect deleted or missing log record within the hash chain", () => {
      const chain = createSampleChain();

      // Attacker deleted record #2 to hide the payroll approval
      const brokenChain = [chain[0], chain[2]];

      const report = DlpService.verifyLogChain(brokenChain);
      expect(report.isValid).toBe(false);
      expect(report.tamperedLogId).toBe("log-003"); // Link from log-001 to log-003 breaks
    });
  });

  describe("4. Data Exfiltration Defense & Watermarking", () => {
    it("should generate a verifiable forensic watermark with user ID, IP, and Trace ID", () => {
      const watermark = DlpService.generateWatermark({
        userId: "admin-hr-01",
        ipAddress: "203.144.144.1",
      });

      expect(watermark).toContain("CONFIDENTIAL");
      expect(watermark).toContain("SMARTJEFF-J2K");
      expect(watermark).toContain("admin-hr-01");
      expect(watermark).toContain("203.144.144.1");
      expect(watermark).toContain("TRACE-");
    });

    it("should flag high risk on mass download (>200 records) by non-admins", () => {
      const result = DlpService.inspectExport({
        userId: "emp-staff-99",
        resource: "PayrollMaster",
        recordCount: 250,
        userRole: "EMPLOYEE",
      });

      expect(result.allowed).toBe(false);
      expect(result.riskLevel).toBe("HIGH");
      expect(result.reason).toContain("DLP Block");
    });

    it("should allow bulk export for Admin with forensic watermark logging", () => {
      const result = DlpService.inspectExport({
        userId: "admin-master",
        resource: "PayrollMaster",
        recordCount: 152,
        userRole: "ADMIN",
      });

      expect(result.allowed).toBe(true);
      expect(result.riskLevel).toBe("MEDIUM");
      expect(result.reason).toContain("DLP Audit");
    });
  });
});
