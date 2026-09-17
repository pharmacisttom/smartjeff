import { prisma } from "@/lib/prisma";
import { IncidentService } from "./incident.service";
import { FindingService } from "./finding.service";
import { CAPAService } from "./capa.service";
import { RiskManagementService } from "./risk-management.service";
import { ComplianceService } from "./compliance.service";
import { TrainingCertificationService } from "./training-certification.service";
import { AuditService } from "./audit.service";

export interface PredictiveAlert {
  id: string;
  type: "CRITICAL_CAPA_OVERDUE" | "CONSECUTIVE_INSPECTION_FAILS" | "EXPIRING_MANDATORY_CERTS" | "CRITICAL_INCIDENT_UNRESOLVED";
  severity: "HIGH" | "CRITICAL";
  title: string;
  description: string;
  recommendedAction: string;
  siteId?: string;
  projectId?: string;
}

export class QHSERiskIntelligenceService {
  /**
   * Retrieves high-level executive QHSE KPIs
   */
  static async getExecutiveMetrics(siteId?: string) {
    const [incidentSummary, findingSummary, capaSummary, riskSummary, complianceSummary, trainingSummary, auditSummary] =
      await Promise.all([
        IncidentService.getIncidentSummary(siteId),
        FindingService.getFindingSummary(siteId),
        CAPAService.getCAPASummary(),
        RiskManagementService.getRiskSummary(siteId),
        ComplianceService.getComplianceSummary(),
        TrainingCertificationService.getTrainingSummary(),
        AuditService.getAuditSummary(),
      ]);

    return {
      safety: {
        openIncidents: incidentSummary.open,
        criticalIncidents: incidentSummary.critical,
        highIncidents: incidentSummary.high,
        nearMisses: incidentSummary.nearMisses,
        openFindings: findingSummary.open,
        criticalFindings: findingSummary.critical,
      },
      quality: {
        overdueCAPA: capaSummary.overdue,
        dueSoonCAPA: capaSummary.dueSoon,
        openCAPA: capaSummary.open,
        verifiedCAPA: capaSummary.verified,
        openFindings: findingSummary.open,
        majorFindings: findingSummary.major,
      },
      risk: {
        criticalRisks: riskSummary.critical,
        highRisks: riskSummary.high,
        totalActiveRisks: riskSummary.total,
      },
      compliance: {
        totalRequirements: complianceSummary.total,
        compliant: complianceSummary.compliant,
        nonCompliant: complianceSummary.nonCompliant,
        expiringSoon: complianceSummary.expiring,
        openGaps: complianceSummary.openGaps,
      },
      training: {
        expiringCertificates: trainingSummary.expiringCount,
        expiredCertificates: trainingSummary.expiredCount,
      },
      audit: {
        plannedAudits: auditSummary.planned,
        activeAudits: auditSummary.inProgress + auditSummary.reporting,
      },
    };
  }

  /**
   * Rule-based predictive risk alerts for operations
   */
  static async getPredictiveAlerts(): Promise<PredictiveAlert[]> {
    const alerts: PredictiveAlert[] = [];

    // 1. Critical CAPAs that are overdue
    const overdueCriticalCapas = await prisma.correctivePreventiveAction.findMany({
      where: {
        priority: "URGENT",
        status: { notIn: ["CLOSED", "VERIFIED"] },
        dueDate: { lt: new Date() },
      },
      take: 5,
    });

    for (const capa of overdueCriticalCapas) {
      alerts.push({
        id: `ALERT-CAPA-${capa.id}`,
        type: "CRITICAL_CAPA_OVERDUE",
        severity: "CRITICAL",
        title: `มาตรการแก้ไขเร่งด่วนเกินกำหนด: ${capa.capaNo}`,
        description: `CAPA: ${capa.title} ครบกำหนดเมื่อ ${capa.dueDate.toISOString().split("T")[0]} แต่ยังไม่ได้รับการปิดหรือตรวจสอบ`,
        recommendedAction: "ประสานงาน Safety/Quality Officer ตรวจสอบความคืบหน้าการแก้ไขทันที",
      });
    }

    // 2. Unresolved critical incidents > 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const criticalOpenIncidents = await prisma.incident.findMany({
      where: {
        severity: "CRITICAL",
        status: { in: ["REPORTED", "ACKNOWLEDGED", "INVESTIGATING"] },
        occurredAt: { lt: oneDayAgo },
      },
      take: 5,
    });

    for (const inc of criticalOpenIncidents) {
      alerts.push({
        id: `ALERT-INC-${inc.id}`,
        type: "CRITICAL_INCIDENT_UNRESOLVED",
        severity: "CRITICAL",
        title: `อุบัติการณ์ระดับวิกฤติยังไม่ได้รับการควบคุม: ${inc.incidentNo}`,
        description: `เหตุการณ์ ${inc.description} เกิดขึ้นเกิน 24 ชม. และยังอยู่ในสถานะ ${inc.status}`,
        recommendedAction: "ประชุมด่วน Executive Committee เพื่ออนุมัติ Action Plan และมาตรการกักกันพื้นที่",
        siteId: inc.siteId || undefined,
        projectId: inc.projectId || undefined,
      });
    }

    // 3. Certificates expiring within 7 days
    const criticalExpiringCerts = await TrainingCertificationService.getExpiringCertifications(7);
    if (criticalExpiringCerts.length > 0) {
      alerts.push({
        id: "ALERT-CERTS-7DAYS",
        type: "EXPIRING_MANDATORY_CERTS",
        severity: "HIGH",
        title: `มีใบรับรองพนักงานหมดอายุภายใน 7 วัน (${criticalExpiringCerts.length} รายการ)`,
        description: `ตรวจพบพนักงานที่มีใบอนุญาต/วุฒิบัตรใกล้หมดอายุ ซึ่งอาจกระทบต่อคุณสมบัติการเข้าทำงานหน้างาน`,
        recommendedAction: "ส่งต่อข้อมูลให้ HR/Training ประสานงานอบรมหรือต่ออายุใบรับรองโดยด่วน",
      });
    }

    return alerts;
  }

  /**
   * Rule-based Repeat Finding Detection
   * Analyzes findings across the last 90 days to identify recurring categories/patterns
   */
  static async detectRepeatFindings() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const findings = await prisma.finding.findMany({
      where: {
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        id: true,
        findingNo: true,
        title: true,
        source: true,
        classification: true,
        siteId: true,
        createdAt: true,
      },
    });

    // Group by title similarity / keywords
    const counts: Record<string, { count: number; items: any[] }> = {};
    for (const f of findings) {
      const normalized = f.title.toLowerCase().trim();
      if (!counts[normalized]) counts[normalized] = { count: 0, items: [] };
      counts[normalized].count += 1;
      counts[normalized].items.push(f);
    }

    const repeatPatterns = Object.entries(counts)
      .filter(([_, data]) => data.count >= 2)
      .map(([title, data]) => ({
        pattern: title,
        occurrences: data.count,
        sampleFindings: data.items.map((i) => i.findingNo),
      }));

    return repeatPatterns;
  }
}
