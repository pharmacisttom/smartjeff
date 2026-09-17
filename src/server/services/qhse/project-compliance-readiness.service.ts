import { prisma } from "@/lib/prisma";

export interface ReadinessItem {
  id: string;
  name: string;
  category: string;
  isCompliant: boolean;
  notes: string;
}

export interface ProjectReadinessEvaluation {
  projectId: string;
  readinessScore: number; // 0 - 100
  status: "READY" | "PARTIAL" | "NOT_READY";
  items: ReadinessItem[];
  blockers: string[];
}

export class ProjectComplianceReadinessService {
  /**
   * Evaluates project startup compliance readiness across 8 key operational criteria
   */
  static async evaluateProjectReadiness(projectId: string): Promise<ProjectReadinessEvaluation> {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contracts: true,
      },
    });
    if (!project) throw new Error("Project not found");

    const items: ReadinessItem[] = [];
    const blockers: string[] = [];

    // 1. Contract signed and active
    const hasActiveContract = project.contracts.some((c) => c.status === "ACTIVE");
    items.push({
      id: "CONTRACT_ACTIVE",
      name: "สัญญาโครงการมีผลบังคับใช้ (Signed & Active Contract)",
      category: "COMMERCIAL",
      isCompliant: hasActiveContract,
      notes: hasActiveContract ? "Active contract found" : "No active contract registered",
    });
    if (!hasActiveContract) blockers.push("Contract is not active");

    // 2. Compliance Gaps check
    const openCriticalGaps = await prisma.complianceGap.count({
      where: {
        entityType: "PROJECT",
        entityId: projectId,
        severity: { in: ["HIGH", "CRITICAL"] },
        status: { not: "RESOLVED" },
      },
    });
    const gapsCompliant = openCriticalGaps === 0;
    items.push({
      id: "NO_CRITICAL_GAPS",
      name: "ไม่มี Compliance Gap ระดับวิกฤติตกค้าง",
      category: "REGULATORY",
      isCompliant: gapsCompliant,
      notes: gapsCompliant ? "No open high/critical gaps" : `${openCriticalGaps} open critical compliance gaps`,
    });
    if (!gapsCompliant) blockers.push("Unresolved high/critical compliance gaps exist");

    // 3. Site Safety Inspection check
    const inspections = await prisma.inspection.findMany({
      where: { projectId, result: "PASS" },
    });
    const siteInspectionPassed = inspections.length > 0;
    items.push({
      id: "SITE_INSPECTION_PASS",
      name: "ผ่านการตรวจสอบความปลอดภัยหน้างาน (Site Safety Inspection)",
      category: "SAFETY",
      isCompliant: siteInspectionPassed,
      notes: siteInspectionPassed ? "Passed safety inspection completed" : "No passed safety inspection on record",
    });
    if (!siteInspectionPassed) blockers.push("Site safety inspection has not passed");

    // 4. Operational Permits check
    const permits = await prisma.permit.findMany({
      where: { projectId, status: "VALID" },
    });
    const permitsInPlace = permits.length > 0;
    items.push({
      id: "PERMITS_IN_PLACE",
      name: "ใบอนุญาตปฏิบัติการถูกต้องและยังไม่หมดอายุ (Operating Permits)",
      category: "LEGAL",
      isCompliant: permitsInPlace,
      notes: permitsInPlace ? `${permits.length} valid permits verified` : "No valid permits registered for project",
    });

    // 5. Open Critical Findings check
    const openCriticalFindings = await prisma.finding.count({
      where: {
        projectId,
        classification: "CRITICAL",
        status: { not: "CLOSED" },
      },
    });
    const noCriticalFindings = openCriticalFindings === 0;
    items.push({
      id: "NO_CRITICAL_FINDINGS",
      name: "ไม่มี Safety Finding ระดับวิกฤติคั่งค้าง (No Critical Findings)",
      category: "SAFETY",
      isCompliant: noCriticalFindings,
      notes: noCriticalFindings ? "Clear" : `${openCriticalFindings} critical findings awaiting closure`,
    });
    if (!noCriticalFindings) blockers.push("Open critical safety findings must be resolved");

    // 6. Overdue CAPA check
    const overdueCapas = await prisma.correctivePreventiveAction.count({
      where: {
        finding: { projectId },
        status: { notIn: ["CLOSED", "VERIFIED"] },
        dueDate: { lt: new Date() },
      },
    });
    const noOverdueCapas = overdueCapas === 0;
    items.push({
      id: "NO_OVERDUE_CAPA",
      name: "ไม่มีมาตรการแก้ไข CAPA เกินกำหนดเวลา",
      category: "QUALITY",
      isCompliant: noOverdueCapas,
      notes: noOverdueCapas ? "All CAPAs on schedule" : `${overdueCapas} overdue CAPAs`,
    });

    // 7. High Residual Risk check
    const criticalRisks = await prisma.riskRegister.count({
      where: {
        projectId,
        residualLevel: "CRITICAL",
        status: "ACTIVE",
      },
    });
    const noUnmitigatedCriticalRisk = criticalRisks === 0;
    items.push({
      id: "RISK_MITIGATED",
      name: "ความเสี่ยงระดับวิกฤติได้รับการควบคุม (Mitigated Risk)",
      category: "RISK",
      isCompliant: noUnmitigatedCriticalRisk,
      notes: noUnmitigatedCriticalRisk ? "No active critical residual risks" : `${criticalRisks} active critical risks without acceptance`,
    });
    if (!noUnmitigatedCriticalRisk) blockers.push("Active critical residual risks exist");

    // 8. Operations Handover checklist check
    const handover = await prisma.projectHandover.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    const handoverConfirmed = Boolean(handover?.riskConfirmed && handover?.siteConfirmed);
    items.push({
      id: "HANDOVER_CONFIRMED",
      name: "การส่งมอบงานฝ่ายปฏิบัติการได้รับการยืนยัน (Handover Confirmed)",
      category: "OPERATIONS",
      isCompliant: handoverConfirmed,
      notes: handoverConfirmed ? "Operations handover verified" : "Pending operations handover sign-off",
    });

    // Calculate score
    const compliantCount = items.filter((i) => i.isCompliant).length;
    const readinessScore = Math.round((compliantCount / items.length) * 100);

    let status: "READY" | "PARTIAL" | "NOT_READY" = "NOT_READY";
    if (readinessScore >= 90 && blockers.length === 0) {
      status = "READY";
    } else if (readinessScore >= 60) {
      status = "PARTIAL";
    }

    return {
      projectId,
      readinessScore,
      status,
      items,
      blockers,
    };
  }
}
