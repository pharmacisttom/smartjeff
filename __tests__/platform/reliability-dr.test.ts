import { describe, it, expect, beforeEach } from "vitest";
import { platformHealthService } from "@/server/platform/health/platform-health.service";
import { backupService } from "@/server/platform/backup/backup.service";
import { restoreVerificationService } from "@/server/platform/restore/restore-verification.service";
import { maskSensitiveData, platformLogger } from "@/server/platform/logging/structured-logger";
import { errorMonitorService } from "@/server/platform/error/error-monitor.service";
import { businessContinuityService } from "@/server/platform/continuity/business-continuity.service";
import { sloService } from "@/server/platform/slo/slo.service";
import { disasterRecoveryService } from "@/server/platform/dr/disaster-recovery.service";
import { deploymentHealthService } from "@/server/platform/deploy/deployment-health.service";

describe("Phase 25 — Platform Reliability, Observability & Disaster Recovery", () => {
  describe("1. Health Architecture (Liveness & Readiness)", () => {
    it("should return valid liveness probe", () => {
      const liveness = platformHealthService.getLiveness();
      expect(liveness.status).toBe("OK");
      expect(liveness.uptimeSeconds).toBeGreaterThanOrEqual(0);
      expect(liveness.timestamp).toBeDefined();
    });

    it("should return readiness probe status with database check", async () => {
      const readiness = await platformHealthService.getReadiness();
      expect(readiness.checks).toHaveProperty("database");
      expect(["HEALTHY", "UNHEALTHY"]).toContain(readiness.checks.database.status);
    });

    it("should return detailed health across all catalog services", async () => {
      const detailed = await platformHealthService.getDetailedHealth();
      expect(detailed.services.length).toBeGreaterThanOrEqual(6);
      const serviceCodes = detailed.services.map((s) => s.code);
      expect(serviceCodes).toContain("POSTGRESQL");
      expect(serviceCodes).toContain("REDIS");
      expect(serviceCodes).toContain("WEB");
      expect(serviceCodes).toContain("OBJECT_STORAGE");
      expect(detailed.systemMetrics).toHaveProperty("cpuUsage");
      expect(detailed.systemMetrics).toHaveProperty("memoryUsagePercent");
    });
  });

  describe("2. Structured Logging & Sensitive Log Masking", () => {
    it("should mask passwords, secrets, tokens and financial data", () => {
      const sensitiveObj = {
        username: "admin",
        password: "SuperSecretPassword123!",
        userToken: "eyJhbGciOiJIUzI1NiIsIn...",
        apiSecret: "sec_999",
        salary: 75000,
        bankAccount: "123-456-7890",
        nested: {
          clientSecret: "cl_abc",
          validField: "Hello SmartJeff",
        },
      };

      const masked = maskSensitiveData(sensitiveObj);
      expect(masked.password).toBe("[REDACTED]");
      expect(masked.userToken).toBe("[REDACTED]");
      expect(masked.apiSecret).toBe("[REDACTED]");
      expect(masked.salary).toBe("[REDACTED]");
      expect(masked.bankAccount).toBe("[REDACTED]");
      expect(masked.nested.clientSecret).toBe("[REDACTED]");
      expect(masked.nested.validField).toBe("Hello SmartJeff");
    });

    it("should mask Bearer tokens in raw strings", () => {
      const rawString = "Authorization: Bearer my_jwt_token_123456";
      const masked = maskSensitiveData(rawString);
      expect(masked).toBe("Authorization: Bearer [MASKED_TOKEN]");
    });
  });

  describe("3. Error Monitoring & Deduplication", () => {
    it("should generate consistent fingerprint for identical error stacks", () => {
      const errType = "DatabaseTimeoutError";
      const msg = "Query timed out after 5000ms";
      const stack = "Error: at async query (db.ts:45:12) at handleReq (server.ts:120:5)";

      const fp1 = errorMonitorService.generateFingerprint(errType, msg, stack);
      const fp2 = errorMonitorService.generateFingerprint(errType, msg, stack);
      expect(fp1).toBe(fp2);
      expect(fp1.length).toBe(64); // SHA-256
    });

    it("should capture error and increment count on duplicate", async () => {
      const testErr = new Error("Synthetic test error for SRE monitoring");
      const rec1 = await errorMonitorService.captureError({
        service: "WEB",
        route: "/api/test",
        error: testErr,
        message: testErr.message,
      });

      if (rec1) {
        expect(rec1.count).toBeGreaterThanOrEqual(1);
        const rec2 = await errorMonitorService.captureError({
          service: "WEB",
          route: "/api/test",
          error: testErr,
          message: testErr.message,
        });
        if (rec2) {
          expect(rec2.id).toBe(rec1.id);
          expect(rec2.count).toBe(rec1.count + 1);
        }
      }
    });
  });

  describe("4. Backup & Restore Verification Framework", () => {
    it("should create an encrypted backup with SHA-256 checksum", async () => {
      const backup = await backupService.createBackup({
        backupType: "DATABASE_FULL",
        destination: "LOCAL",
        encrypt: true,
        retentionDays: 7,
      });

      expect(backup.status).toBe("SUCCESS");
      expect(backup.checksumSha256).toBeDefined();
      expect(backup.checksumSha256.length).toBe(64);
      expect(backup.isEncrypted).toBe(true);
      expect(backup.sizeBytes).toBeGreaterThan(0);
    });

    it("should verify backup in an isolated temporary sandbox", async () => {
      const backup = await backupService.createBackup({
        backupType: "DATABASE_FULL",
        encrypt: true,
      });

      const verification = await restoreVerificationService.verifyBackup(backup.id);
      expect(verification.verified).toBe(true);
      expect(verification.checks.checksumValid).toBe(true);
      expect(verification.checks.decryptionValid).toBe(true);
      expect(verification.checks.schemaValid).toBe(true);
      expect(verification.checks.integrityValid).toBe(true);
      expect(verification.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("CRITICAL GUARDRAIL: should strictly reject unauthorized production restore", async () => {
      const backup = await backupService.createBackup();

      // Case A: Missing confirmation text
      await expect(
        restoreVerificationService.restoreToProduction(backup.id, {
          target: "production",
          confirmText: "WRONG_TOKEN",
          mfaVerified: true,
          approvedByRole: "PLATFORM_ADMIN",
        })
      ).rejects.toThrow("Invalid confirmation token text");

      // Case B: Missing MFA step-up
      await expect(
        restoreVerificationService.restoreToProduction(backup.id, {
          target: "production",
          confirmText: "RESTORE_PRODUCTION_OVERWRITE_CONFIRMED",
          mfaVerified: false,
          approvedByRole: "PLATFORM_ADMIN",
        })
      ).rejects.toThrow("Step-up MFA verification required");

      // Case C: Unauthorized role
      await expect(
        restoreVerificationService.restoreToProduction(backup.id, {
          target: "production",
          confirmText: "RESTORE_PRODUCTION_OVERWRITE_CONFIRMED",
          mfaVerified: true,
          approvedByRole: "GUEST_USER",
        })
      ).rejects.toThrow("Unauthorized role");

      // Case D: Valid supervisor execution
      const approved = await restoreVerificationService.restoreToProduction(backup.id, {
        target: "production",
        confirmText: "RESTORE_PRODUCTION_OVERWRITE_CONFIRMED",
        mfaVerified: true,
        approvedByRole: "PLATFORM_ADMIN",
      });
      expect(approved.success).toBe(true);
    });
  });

  describe("5. Business Continuity & Maintenance Mode", () => {
    it("should allow mutations in NORMAL mode", async () => {
      await businessContinuityService.setMaintenanceMode({ mode: "NORMAL" });
      const check = await businessContinuityService.isMutationPermitted("POST", "EMPLOYEE");
      expect(check.permitted).toBe(true);
    });

    it("should block non-admin mutations in READ_ONLY mode", async () => {
      await businessContinuityService.setMaintenanceMode({
        mode: "READ_ONLY",
        reason: "Database Migration",
      });

      // GET requests always permitted
      const getCheck = await businessContinuityService.isMutationPermitted("GET", "EMPLOYEE");
      expect(getCheck.permitted).toBe(true);

      // POST blocked for normal employee
      const postCheck = await businessContinuityService.isMutationPermitted("POST", "EMPLOYEE");
      expect(postCheck.permitted).toBe(false);

      // POST permitted for Admin/SRE bypass
      const adminCheck = await businessContinuityService.isMutationPermitted("POST", "PLATFORM_ADMIN");
      expect(adminCheck.permitted).toBe(true);

      // Clean up to NORMAL
      await businessContinuityService.setMaintenanceMode({ mode: "NORMAL" });
    });
  });

  describe("6. Disaster Recovery & SLO Calculations", () => {
    it("should evaluate RPO / RTO targets across services", async () => {
      const status = await disasterRecoveryService.getRpoRtoStatus();
      expect(status.services.length).toBeGreaterThanOrEqual(5);
      const dbService = status.services.find((s) => s.service.includes("PostgreSQL"));
      expect(dbService).toBeDefined();
      expect(dbService?.targetRpoMinutes).toBe(15);
      expect(dbService?.targetRtoMinutes).toBe(45);
    });

    it("should track Service Level Objectives and error budgets", async () => {
      const slos = await sloService.getSlos();
      expect(slos.length).toBeGreaterThanOrEqual(3);
      const webSlo = slos.find((s) => s.code === "SLO_WEB_AVAILABILITY");
      expect(webSlo).toBeDefined();
      expect(webSlo?.targetPercentage).toBe(99.9);
      expect(webSlo?.remainingBudgetMinutes).toBeGreaterThanOrEqual(0);
    });

    it("should return safe version info without exposing secrets", () => {
      const version = deploymentHealthService.getVersionInfo();
      expect(version.version).toBeDefined();
      expect(version.gitCommit).toBeDefined();
      expect(version).not.toHaveProperty("DATABASE_URL");
      expect(version).not.toHaveProperty("SECRET_KEY");
    });
  });
});
