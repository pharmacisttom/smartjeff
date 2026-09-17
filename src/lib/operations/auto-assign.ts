import { LatLng, haversineDistance } from "../geo/haversine";

export interface EmployeeCandidate {
  id: string;
  name: string;
  lat: number;
  lng: number;
  currentSiteId?: string;
  currentSiteName?: string;
}

export interface SiteRequirement {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  requiredCapacity: number;
  currentStaffCount: number;
}

export interface AssignmentResult {
  employeeId: string;
  employeeName: string;
  assignedSiteId: string;
  assignedSiteName: string;
  distanceKm: number;
  estimatedCost: number;
  reasoning: string;
}

export function autoAssignWorkforce(
  employees: EmployeeCandidate[],
  sites: SiteRequirement[],
  ratePerKm: number = 5
): {
  assignments: AssignmentResult[];
  totalSavedKm: number;
  totalSavedCost: number;
  unassignedEmployees: EmployeeCandidate[];
} {
  const assignments: AssignmentResult[] = [];
  const assignedEmpIds = new Set<string>();

  // Sort sites by staffing deficit (capacity needed most)
  const sortedSites = [...sites].sort(
    (a, b) => b.requiredCapacity - b.currentStaffCount - (a.requiredCapacity - a.currentStaffCount)
  );

  for (const site of sortedSites) {
    const deficit = site.requiredCapacity - site.currentStaffCount;
    if (deficit <= 0) continue;

    // Find nearest unassigned employees for this site
    const available = employees.filter((e) => !assignedEmpIds.has(e.id));
    const candidateDistances = available.map((emp) => {
      const distMeters = haversineDistance(emp.lat, emp.lng, site.lat, site.lng);
      return {
        emp,
        distMeters,
        distKm: Math.round((distMeters / 1000) * 10) / 10,
      };
    });

    candidateDistances.sort((a, b) => a.distMeters - b.distMeters);
    const selected = candidateDistances.slice(0, deficit);

    for (const item of selected) {
      assignedEmpIds.add(item.emp.id);
      assignments.push({
        employeeId: item.emp.id,
        employeeName: item.emp.name,
        assignedSiteId: site.id,
        assignedSiteName: site.name,
        distanceKm: item.distKm,
        estimatedCost: Math.round(item.distKm * ratePerKm),
        reasoning: `ระยะทางใกล้ที่สุด (${item.distKm} กม.) ช่วยประหยัดค่าเดินทาง`,
      });
    }
  }

  const unassignedEmployees = employees.filter((e) => !assignedEmpIds.has(e.id));
  const totalKm = assignments.reduce((acc, a) => acc + a.distanceKm, 0);

  return {
    assignments,
    totalSavedKm: Math.round(totalKm * 0.2), // Estimated 20% savings compared to unoptimized routing
    totalSavedCost: Math.round(totalKm * 0.2 * ratePerKm * 22), // 22 working days
    unassignedEmployees,
  };
}
