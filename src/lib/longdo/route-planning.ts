/**
 * Longdo Multi-Stop Route Planning & Optimization Layer
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

import { calculateDistanceMatrixLongdo } from "./matrix";
import { calculateRouteLongdo } from "./route";
import { LatLng, LongdoRouteResult, RoutePlanningInput, RoutePlanningResult } from "./types";

export async function optimizeRoutePlanningLongdo(
  input: RoutePlanningInput
): Promise<RoutePlanningResult> {
  const { origin, destinations, mode = "t" } = input;

  if (destinations.length === 0) {
    return {
      originalOrder: [],
      optimizedOrder: [],
      totalDistanceMeters: 0,
      totalDurationSeconds: 0,
      savedDistanceKm: 0,
      savedDurationMinutes: 0,
      waypoints: [origin],
      routes: [],
    };
  }

  // Single destination case
  if (destinations.length === 1) {
    const route = await calculateRouteLongdo(origin, destinations[0], { mode: mode as any });
    return {
      originalOrder: [0],
      optimizedOrder: [0],
      totalDistanceMeters: route.distanceMeters,
      totalDurationSeconds: route.durationSeconds,
      savedDistanceKm: 0,
      savedDurationMinutes: 0,
      waypoints: [origin, destinations[0]],
      routes: [route],
    };
  }

  // Multi-destination TSP Nearest Neighbor Optimization using Distance Matrix
  const allPoints = [origin, ...destinations];
  const matrixRes = await calculateDistanceMatrixLongdo(allPoints, allPoints, mode);

  const visited = new Set<number>([0]);
  const optimizedIndices: number[] = [];
  let currentIdx = 0;

  while (visited.size < allPoints.length) {
    let nearestIdx = -1;
    let minDistance = Infinity;

    for (let i = 1; i < allPoints.length; i++) {
      if (!visited.has(i)) {
        const dist = matrixRes.matrix[currentIdx]?.[i]?.distanceMeters ?? Infinity;
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }
    }

    if (nearestIdx !== -1) {
      visited.add(nearestIdx);
      optimizedIndices.push(nearestIdx - 1); // convert to 0-based destination index
      currentIdx = nearestIdx;
    } else {
      break;
    }
  }

  // Calculate routes along the optimized sequence
  const waypoints = [origin, ...optimizedIndices.map((i) => destinations[i])];
  const routes: LongdoRouteResult[] = [];
  let totalDist = 0;
  let totalDur = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const legRoute = await calculateRouteLongdo(waypoints[i], waypoints[i + 1], { mode: mode as any });
    routes.push(legRoute);
    totalDist += legRoute.distanceMeters;
    totalDur += legRoute.durationSeconds;
  }

  // Calculate unoptimized sequence metrics for comparison
  let unoptimizedDist = 0;
  let unoptimizedDur = 0;
  const originalWaypoints = [origin, ...destinations];
  for (let i = 0; i < originalWaypoints.length - 1; i++) {
    const legDist = matrixRes.matrix[i]?.[i + 1]?.distanceMeters ?? 0;
    const legDur = matrixRes.matrix[i]?.[i + 1]?.durationSeconds ?? 0;
    unoptimizedDist += legDist;
    unoptimizedDur += legDur;
  }

  const savedDistMeters = Math.max(0, unoptimizedDist - totalDist);
  const savedDurSeconds = Math.max(0, unoptimizedDur - totalDur);

  return {
    originalOrder: destinations.map((_, idx) => idx),
    optimizedOrder: optimizedIndices,
    totalDistanceMeters: totalDist,
    totalDurationSeconds: totalDur,
    savedDistanceKm: Math.round((savedDistMeters / 1000) * 10) / 10,
    savedDurationMinutes: Math.round(savedDurSeconds / 60),
    waypoints,
    routes,
  };
}
