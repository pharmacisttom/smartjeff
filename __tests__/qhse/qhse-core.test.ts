import { describe, it, expect } from "vitest";
import { RiskManagementService } from "@/server/services/qhse/risk-management.service";
import { CAPAService } from "@/server/services/qhse/capa.service";
import { InspectionService } from "@/server/services/qhse/inspection.service";
import { TrainingCertificationService } from "@/server/services/qhse/training-certification.service";
import { ProjectComplianceReadinessService } from "@/server/services/qhse/project-compliance-readiness.service";
import { prisma } from "@/lib/prisma";

describe("Phase 18: QHSE, Risk & Compliance Core Unit Tests", () => {
  describe("1. 5x5 Risk Matrix Engine", () => {
    it("should calculate correct risk scores and levels based on 5x5 matrix", () => {
      // 1 x 1 = 1 => LOW
      expect(RiskManagementService.calculateRiskLevel(1, 1)).toEqual({ score: 1, level: "LOW" });

      // 2 x 2 = 4 => LOW
      expect(RiskManagementService.calculateRiskLevel(2, 2)).toEqual({ score: 4, level: "LOW" });

      // 2 x 3 = 6 => MODERATE
      expect(RiskManagementService.calculateRiskLevel(2, 3)).toEqual({ score: 6, level: "MODERATE" });

      // 3 x 3 = 9 => MODERATE
      expect(RiskManagementService.calculateRiskLevel(3, 3)).toEqual({ score: 9, level: "MODERATE" });

      // 3 x 4 = 12 => HIGH
      expect(RiskManagementService.calculateRiskLevel(3, 4)).toEqual({ score: 12, level: "HIGH" });

      // 3 x 5 = 15 => HIGH
      expect(RiskManagementService.calculateRiskLevel(3, 5)).toEqual({ score: 15, level: "HIGH" });

      // 4 x 4 = 16 => CRITICAL
      expect(RiskManagementService.calculateRiskLevel(4, 4)).toEqual({ score: 16, level: "CRITICAL" });

      // 5 x 5 = 25 => CRITICAL
      expect(RiskManagementService.calculateRiskLevel(5, 5)).toEqual({ score: 25, level: "CRITICAL" });
    });

    it("should clamp out-of-bounds likelihood and impact values to [1, 5]", () => {
      // 0 or negative clamped to 1
      expect(RiskManagementService.calculateRiskLevel(0, -2)).toEqual({ score: 1, level: "LOW" });

      // > 5 clamped to 5
      expect(RiskManagementService.calculateRiskLevel(10, 8)).toEqual({ score: 25, level: "CRITICAL" });
    });

    it("should reject unauthorized risk acceptance for High or Critical risks", async () => {
      // Create a test high risk
      const risk = await RiskManagementService.createRisk({
        title: "Test High Risk",
        description: "High voltage exposure without cage",
        likelihood: 4,
        impact: 4, // Score 16 = CRITICAL
        ownerId: "SAFETY_OFFICER",
      });

      // Employee attempts to accept risk => must throw unauthorized
      await expect(
        RiskManagementService.acceptRisk(risk.id, "EMP_101", "EMPLOYEE", "Self-accepted")
      ).rejects.toThrow(/Unauthorized/);

      // Executive or QHSE_MANAGER can accept
      const accepted = await RiskManagementService.acceptRisk(
        risk.id,
        "EXEC_01",
        "EXECUTIVE",
        "Management formal acceptance with containment controls"
      );
      expect(accepted.status).toBe("ACCEPTED");
      expect(accepted.treatment).toBe("ACCEPT");
    });
  });

  describe("2. CAPA Workflow & Separation of Duties", () => {
    it("should prevent CAPA owner from verifying their own action plan", async () => {
      const capa = await CAPAService.createCAPA({
        title: "Install safety interlocking mechanism",
        description: "Fix conveyor belt emergency stop button",
        ownerId: "TECHNICIAN_A",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        actionType: "CORRECTIVE",
      });

      // Owner attempts self-verification => should throw
      await expect(
        CAPAService.verifyCAPA(capa.id, "TECHNICIAN_A", "I verified my own work", true)
      ).rejects.toThrow(/Separation of Duties violation/);

      // Distinct Quality/Safety Officer verifies => succeeds
      const verified = await CAPAService.verifyCAPA(
        capa.id,
        "SAFETY_INSPECTOR_B",
        "Mechanisms tested and functional",
        true
      );
      expect(verified.status).toBe("VERIFIED");
      expect(verified.verifiedBy).toBe("SAFETY_INSPECTOR_B");
      expect(verified.effectivenessReviewDue).toBeDefined();
    });

    it("should handle 30/60/90-day effectiveness review and reopening", async () => {
      const capa = await CAPAService.createCAPA({
        title: "PPE Compliance re-training",
        description: "Mandatory safety boots on shop floor",
        ownerId: "SUPERVISOR_C",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

      await CAPAService.verifyCAPA(capa.id, "AUDITOR_X", "Verified", false);

      // Record not effective review => status reopens to IN_PROGRESS
      const reviewed = await CAPAService.recordEffectivenessReview(
        capa.id,
        "AUDITOR_X",
        "NOT_EFFECTIVE",
        "Repeat non-compliance observed on shop floor"
      );

      expect(reviewed.effectivenessStatus).toBe("NOT_EFFECTIVE");
      expect(reviewed.status).toBe("IN_PROGRESS");
    });
  });

  describe("3. Inspection Scoring & Critical Item Failure", () => {
    it("should calculate weighted score and trigger Critical Finding on critical item failure", async () => {
      // Create template with 1 normal item and 1 critical item
      const template = await InspectionService.createTemplate({
        name: "Confined Space Entry Checklist",
        category: "SAFETY",
        createdBy: "SAFETY_MGR",
        items: [
          {
            question: "Is area well ventilated?",
            responseType: "PASS_FAIL",
            weight: 1.0,
            critical: false,
          },
          {
            question: "Is oxygen level tested and above 19.5%?",
            responseType: "PASS_FAIL",
            weight: 2.0,
            critical: true, // CRITICAL ITEM
          },
        ],
      });

      // Normal passes, but Critical fails
      const inspection = await InspectionService.submitInspection({
        templateId: template.id,
        inspectorId: "SAFETY_OFFICER_1",
        items: [
          {
            itemId: template.items[0].id,
            question: template.items[0].question,
            answer: "PASS",
            result: "PASS",
          },
          {
            itemId: template.items[1].id,
            question: template.items[1].question,
            answer: "FAIL",
            result: "FAIL",
            critical: true,
            notes: "Oxygen detected at 17.8% (Dangerous deficiency)",
          },
        ],
      });

      // Overall inspection must be FAIL due to critical failure
      expect(inspection.result).toBe("FAIL");

      // Verify that a Critical Finding was automatically generated
      const findings = await prisma.finding.findMany({
        where: { inspectionId: inspection.id },
      });

      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].classification).toBe("CRITICAL");
      expect(findings[0].priority).toBe("URGENT");
      expect(findings[0].title).toContain("[Critical Inspection Failure]");
    });
  });

  describe("4. Training & Certification Expiry Guardrail", () => {
    it("should classify certificate expiry into 7, 30, 60, 90 days and expired", async () => {
      const now = new Date();
      const empId = `EMP_TEST_${Date.now()}`;

      // Register cert expiring in 5 days
      await TrainingCertificationService.registerCertification({
        employeeId: empId,
        certificateNumber: "CERT-7D",
        name: "Working at Height Level 2",
        issuer: "Safety Association",
        issueDate: new Date(now.getTime() - 360 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      });

      // Register cert already expired 10 days ago
      await TrainingCertificationService.registerCertification({
        employeeId: empId,
        certificateNumber: "CERT-EXP",
        name: "Confined Space Rescue",
        issuer: "Rescue Institute",
        issueDate: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      });

      const expiringList = await TrainingCertificationService.getExpiringCertifications(30);
      const testEmpCerts = expiringList.filter((c) => c.employeeId === empId);

      expect(testEmpCerts.length).toBe(2);
      const cert7d = testEmpCerts.find((c) => c.certificateNumber === "CERT-7D");
      const certExp = testEmpCerts.find((c) => c.certificateNumber === "CERT-EXP");

      expect(cert7d?.alertLevel).toBe("CRITICAL_7_DAYS");
      expect(certExp?.isExpired).toBe(true);
      expect(certExp?.alertLevel).toBe("EXPIRED");
    });

    it("should block workforce assignment if mandatory certificate is expired", async () => {
      const empId = `EMP_GUARDRAIL_${Date.now()}`;

      // Has expired cert
      await TrainingCertificationService.registerCertification({
        employeeId: empId,
        certificateNumber: "CERT-EXPIRED-MANDATORY",
        name: "Scaffolding Inspector",
        issuer: "Safety Board",
        issueDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
        expiryDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      });

      const check = await TrainingCertificationService.validateWorkforceQualification(empId);
      expect(check.qualified).toBe(false);
      expect(check.expiredCertificates).toContain("Scaffolding Inspector");
    });
  });
});
