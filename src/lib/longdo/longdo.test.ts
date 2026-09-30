import { describe, it, expect } from "vitest";
import { haversineDistance } from "../geo/haversine";
import { checkCircleGeofence, checkPolygonGeofence } from "../geo/geofence";

describe("Longdo GIS & Geofence Engine Tests", () => {
  it("calculates accurate Haversine distance between 2 coordinates", () => {
    // Hemaraj Rayong (13.0039, 101.1668) to Amata City Rayong (12.9750, 101.1350)
    const distMeters = haversineDistance(13.0039, 101.1668, 12.9750, 101.1350);
    expect(distMeters).toBeGreaterThan(4000);
    expect(distMeters).toBeLessThan(6000);
  });

  it("correctly validates point inside circular geofence", () => {
    const center = { lat: 13.0039, lng: 101.1668 };
    const insidePoint = { lat: 13.0040, lng: 101.1669 };
    const outsidePoint = { lat: 13.0500, lng: 101.2000 };

    const insideRes = checkCircleGeofence(insidePoint, center, 200);
    expect(insideRes.isWithin).toBe(true);
    expect(insideRes.status).toBe("INSIDE");

    const outsideRes = checkCircleGeofence(outsidePoint, center, 200);
    expect(outsideRes.isWithin).toBe(false);
    expect(outsideRes.status).toBe("OUTSIDE");
  });

  it("correctly validates point inside polygon geofence", () => {
    const polygon = [
      { lat: 13.000, lng: 101.000 },
      { lat: 13.100, lng: 101.000 },
      { lat: 13.100, lng: 101.100 },
      { lat: 13.000, lng: 101.100 },
    ];

    const insidePoint = { lat: 13.050, lng: 101.050 };
    const outsidePoint = { lat: 13.200, lng: 101.050 };

    expect(checkPolygonGeofence(insidePoint, polygon).isWithin).toBe(true);
    expect(checkPolygonGeofence(outsidePoint, polygon).isWithin).toBe(false);
  });
});
