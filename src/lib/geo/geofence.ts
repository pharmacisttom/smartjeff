/**
 * Geofence Validation Engine
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

import { haversineDistance, LatLng } from "./haversine";

export interface CircleGeofence {
  type: "CIRCLE";
  center: LatLng;
  radiusMeters: number;
}

export interface PolygonGeofence {
  type: "POLYGON";
  points: LatLng[];
}

export type GeofenceShape = CircleGeofence | PolygonGeofence;

export interface GeofenceCheckResult {
  isWithin: boolean;
  distanceFromBoundaryMeters: number;
  status: "INSIDE" | "OUTSIDE" | "ON_BORDER";
}

/**
 * Validates if a coordinate point is within a circular geofence boundary.
 */
export function checkCircleGeofence(
  point: LatLng,
  center: LatLng,
  radiusMeters: number
): GeofenceCheckResult {
  const dist = haversineDistance(point.lat, point.lng, center.lat, center.lng);
  const isWithin = dist <= radiusMeters;
  const diff = Math.abs(dist - radiusMeters);

  return {
    isWithin,
    distanceFromBoundaryMeters: Math.round(diff),
    status: isWithin ? "INSIDE" : "OUTSIDE",
  };
}

/**
 * Ray-casting algorithm to test point inside polygon geofence.
 */
export function checkPolygonGeofence(
  point: LatLng,
  polygon: LatLng[]
): GeofenceCheckResult {
  if (!polygon || polygon.length < 3) {
    return { isWithin: false, distanceFromBoundaryMeters: 0, status: "OUTSIDE" };
  }

  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return {
    isWithin: inside,
    distanceFromBoundaryMeters: 0,
    status: inside ? "INSIDE" : "OUTSIDE",
  };
}
