export interface LatLng {
  lat: number;
  lng: number;
}

export interface LocationPoint extends LatLng {
  id?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula (returns distance in meters).
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's mean radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Finds the nearest locations to a target point within a maximum distance radius.
 */
export function findNearestCandidates<T extends LocationPoint>(
  target: LatLng,
  candidates: T[],
  maxDistanceMeters: number = 30000,
  limit: number = 10
): (T & { distanceMeters: number; distanceKm: number })[] {
  return candidates
    .map((candidate) => {
      const distanceMeters = haversineDistance(
        target.lat,
        target.lng,
        candidate.lat,
        candidate.lng
      );
      return {
        ...candidate,
        distanceMeters,
        distanceKm: Math.round((distanceMeters / 1000) * 10) / 10,
      };
    })
    .filter((c) => c.distanceMeters <= maxDistanceMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}
