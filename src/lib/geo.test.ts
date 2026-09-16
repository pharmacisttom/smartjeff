import { describe, it, expect } from "vitest";
import { haversineDistance, isWithinGeofence, formatDistance, detectMockLocation } from "./geo";

describe("Geo Library tests", () => {
  it("calculates accurate Haversine distance between two coordinates", () => {
    // Distance between AAM factory (12.9236, 101.1352) and nearby point
    const dist = haversineDistance(12.9236, 101.1352, 12.9239, 101.1355);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(100);
  });

  it("checks within geofence correctly", () => {
    expect(isWithinGeofence(150, 200)).toBe(true);
    expect(isWithinGeofence(250, 200)).toBe(false);
  });

  it("formats distance nicely in Thai", () => {
    expect(formatDistance(45)).toBe("45 ม.");
    expect(formatDistance(1250)).toBe("1.3 กม.");
  });

  it("detects mock location when accuracy is > 100m", () => {
    expect(detectMockLocation(150)).toBe(true);
    expect(detectMockLocation(15)).toBe(false);
  });
});
