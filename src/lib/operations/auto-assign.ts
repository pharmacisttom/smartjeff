import { LatLng } from "../geo/haversine";
import { calculateDistanceMatrixLongdo } from "../longdo/matrix";

export interface EmployeeCandidate {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentSiteId?: string;
  currentSiteName?: string;
  skills?: string[];
  isAvailable?: boolean;
  currentWorkloadCount?: number;
  siteFamiliarityScore?: number; // 0 to 100
}

export interface SiteRequirement {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  requiredCapacity: number;
  currentStaffCount: number;
  requiredSkills?: string[];
}

export interface AutoAssignWeights {
  skill: number; // default 0.35 (35%)
  availability: number; // default 0.25 (25%)
  travelTime: number; // default 0.20 (20%)
  workload: number; // default 0.10 (10%)
  siteFamiliarity: number; // default 0.10 (10%)
}

export interface AssignmentResult {
  employeeId: string;
  employeeName: string;
  assignedSiteId: string;
  assignedSiteName: string;
  distanceKm: number;
  travelTimeMinutes: number;
  totalScore: number;
  reasoning: string;
}

export async function autoAssignWorkforce(
  employees: EmployeeCandidate[],
  sites: SiteRequirement[],
  weightsConfig?: Partial<AutoAssignWeights>
): Promise<{
  assignments: AssignmentResult[];
  totalSavedKm: number;
  totalSavedCost: number;
  unassignedEmployees: EmployeeCandidate[];
}> {
  const weights: AutoAssignWeights = {
    skill: 0.35,
    availability: 0.25,
    travelTime: 0.20,
    workload: 0.10,
    siteFamiliarity: 0.10,
    ...weightsConfig,
  };

  const assignments: AssignmentResult[] = [];
  const assignedEmpIds = new Set<string>();

  const sortedSites = [...sites].sort(
    (a, b) => b.requiredCapacity - b.currentStaffCount - (a.requiredCapacity - a.currentStaffCount)
  );

  for (const site of sortedSites) {
    const deficit = site.requiredCapacity - site.currentStaffCount;
    if (deficit <= 0) continue;

    const available = employees.filter((e) => !assignedEmpIds.has(e.id));
    if (available.length === 0) break;

    // Fetch real road distance & travel time via Longdo Distance Matrix API
    const origins: LatLng[] = available.map((e) => ({ lat: e.lat, lng: e.lng }));
    const destinations: LatLng[] = [{ lat: site.lat, lng: site.lng }];
    const matrixRes = await calculateDistanceMatrixLongdo(origins, destinations);

    // Compute multi-criteria scores for each employee candidate
    const scoredCandidates = available.map((emp, idx) => {
      const matrixItem = matrixRes.matrix[idx]?.[0];
      const distanceMeters = matrixItem?.distanceMeters || 10000;
      const durationSeconds = matrixItem?.durationSeconds || 900;
      const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
      const travelTimeMinutes = Math.round(durationSeconds / 60);

      // 1. Skill Match Score (0 - 100)
      let skillScore = 100;
      if (site.requiredSkills && site.requiredSkills.length > 0 && emp.skills) {
        const matches = site.requiredSkills.filter((s) => emp.skills!.includes(s));
        skillScore = (matches.length / site.requiredSkills.length) * 100;
      }

      // 2. Availability Score (0 or 100)
      const availScore = emp.isAvailable !== false ? 100 : 0;

      // 3. Travel Time Score (Inverse decay: 0 mins -> 100, 60 mins -> 0)
      const travelScore = Math.max(0, 100 - (travelTimeMinutes / 60) * 100);

      // 4. Workload Score (Lower workload -> higher score)
      const workloadCount = emp.currentWorkloadCount || 0;
      const workloadScore = Math.max(0, 100 - workloadCount * 20);

      // 5. Site Familiarity Score
      const familiarityScore = emp.siteFamiliarityScore ?? (emp.currentSiteId === site.id ? 100 : 50);

      // Weighted Sum
      const totalScore = Math.round(
        skillScore * weights.skill +
          availScore * weights.availability +
          travelScore * weights.travelTime +
          workloadScore * weights.workload +
          familiarityScore * weights.siteFamiliarity
      );

      return {
        emp,
        distanceKm,
        travelTimeMinutes,
        totalScore,
        skillScore,
        travelScore,
      };
    });

    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);
    const selected = scoredCandidates.slice(0, deficit);

    for (const item of selected) {
      assignedEmpIds.add(item.emp.id);
      assignments.push({
        employeeId: item.emp.id,
        employeeName: item.emp.name,
        assignedSiteId: site.id,
        assignedSiteName: site.name,
        distanceKm: item.distanceKm,
        travelTimeMinutes: item.travelTimeMinutes,
        totalScore: item.totalScore,
        reasoning: `คะแนนประเมินรวม ${item.totalScore}/100 (ระยะทาง ${item.distanceKm} กม. ใช้เวลาเดินทาง ${item.travelTimeMinutes} นาที)`,
      });
    }
  }

  const unassignedEmployees = employees.filter((e) => !assignedEmpIds.has(e.id));
  const totalKm = assignments.reduce((acc, a) => acc + a.distanceKm, 0);

  return {
    assignments,
    totalSavedKm: Math.round(totalKm * 0.25),
    totalSavedCost: Math.round(totalKm * 0.25 * 5 * 22),
    unassignedEmployees,
  };
}
