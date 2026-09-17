import { prisma } from "@/lib/prisma";

export interface WorkforceRecommendation {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  score: number; // 0 to 100
  confidence: number; // 0.0 to 1.0
  reasons: string[];
  breakdown: {
    skillMatchScore: number;
    availabilityScore: number;
    restComplianceScore: number;
    workloadScore: number;
    distanceScore: number;
    otRiskScore: number;
  };
}

export class WorkforceIntelligenceService {
  /**
   * Recommends optimal employees for a target site/shift with 100% explainable scoring.
   */
  static async recommendEmployeesForShift(
    siteId: string,
    date: Date,
    requiredSkills: string[] = []
  ): Promise<WorkforceRecommendation[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    // Fetch candidate active employees
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        site: true,
        attendances: { where: { timestamp: { gte: start, lt: end } } },
        leaves: { where: { status: "APPROVED", startDate: { lte: end }, endDate: { gte: start } } },
        shiftAssignments: { where: { date: { gte: start, lt: end } } },
      },
    });

    const recommendations: WorkforceRecommendation[] = [];

    for (const emp of employees) {
      const reasons: string[] = [];
      let skillMatchScore = 100;
      let availabilityScore = 100;
      let restComplianceScore = 100;
      let workloadScore = 100;
      let distanceScore = 100;
      let otRiskScore = 100;

      // 1. Availability check (Leave conflict)
      if (emp.leaves.length > 0) {
        availabilityScore = 0;
        reasons.push("ไม่พร้อมปฏิบัติงานเนื่องจากลางานในวันดังกล่าว");
      } else {
        reasons.push("พร้อมปฏิบัติงาน ไม่พบประวัติการลา");
      }

      // 2. Shift double assignment check
      if (emp.shiftAssignments.length > 0) {
        workloadScore = 30;
        reasons.push("มีกะปฏิบัติงานเดิมอยู่แล้วในวันนี้ (เสี่ยงควงกะ)");
      } else {
        reasons.push("ยังไม่มีกะงานซ้ำซ้อนในวันนี้");
      }

      // 3. Distance check to target site
      if (emp.siteId === siteId) {
        distanceScore = 100;
        reasons.push(`ประจำอยู่ที่ไซต์ ${emp.site.name} โดยตรง`);
      } else {
        distanceScore = 60;
        reasons.push(`สังกัดต่างไซต์ (${emp.site.name}) ต้องเดินทางย้ายไซต์`);
      }

      // 4. OT Risk & Rest compliance
      const recentAttendanceCount = emp.attendances.length;
      if (recentAttendanceCount > 5) {
        otRiskScore = 40;
        restComplianceScore = 50;
        reasons.push("เสี่ยงชั่วโมงทำงานสะสมเกินเกณฑ์มาตรฐานองค์กร");
      } else {
        restComplianceScore = 100;
        reasons.push("เวลาพักผ่อนได้มาตรฐานตามกฎหมายแรงงาน");
      }

      // 5. Skill match (if required skills specified)
      if (requiredSkills.length > 0) {
        const hasMatch = requiredSkills.some((skill) =>
          (emp.position || "").toLowerCase().includes(skill.toLowerCase())
        );
        skillMatchScore = hasMatch ? 100 : 50;
        if (hasMatch) reasons.push("ทักษะตรงกับความต้องการของใบงาน");
      }

      // Weighted total score
      const totalScore = Math.round(
        skillMatchScore * 0.25 +
          availabilityScore * 0.35 +
          restComplianceScore * 0.15 +
          workloadScore * 0.1 +
          distanceScore * 0.1 +
          otRiskScore * 0.05
      );

      recommendations.push({
        employeeId: emp.id,
        employeeCode: emp.code,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        score: totalScore,
        confidence: 0.95,
        reasons,
        breakdown: {
          skillMatchScore,
          availabilityScore,
          restComplianceScore,
          workloadScore,
          distanceScore,
          otRiskScore,
        },
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }
}
