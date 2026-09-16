/**
 * Calculate Haversine distance between two sets of GPS coordinates in meters.
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Check if the calculated distance is within the allowed geofence radius.
 */
export function isWithinGeofence(distanceMeters: number, radiusMeters: number = 200): boolean {
  return distanceMeters <= radiusMeters;
}

/**
 * Detect fake/mock location based on accuracy or abnormal coordinates.
 */
export function detectMockLocation(accuracyMeters?: number | null): boolean {
  if (accuracyMeters && accuracyMeters > 100) {
    return true; // Unusually low accuracy, possible mock or poor signal
  }
  return false;
}

/**
 * Format distance in user-friendly Thai string (e.g., "45 ม." or "1.2 กม.")
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} ม.`;
  }
  return `${(meters / 1000).toFixed(1)} กม.`;
}
