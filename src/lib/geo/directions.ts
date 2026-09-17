import { LatLng, haversineDistance } from "./haversine";
import { encodePolyline } from "./polyline";

export interface RouteResult {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  durationMinutes: number;
  polyline: string;
  steps: {
    instruction: string;
    distanceMeters: number;
    durationSeconds: number;
  }[];
}

export async function calculateRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult> {
  const directDistance = haversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  
  // Real-world road circuit factor (~1.25x direct distance)
  const distanceMeters = Math.round(directDistance * 1.25);
  const distanceKm = Math.round((distanceMeters / 1000) * 10) / 10;
  
  // Average city/industrial speed ~40 km/h (11.1 m/s)
  const durationSeconds = Math.round(distanceMeters / 11.1);
  const durationMinutes = Math.round(durationSeconds / 60);

  // Intermediate points for map path visualization
  const points: LatLng[] = [
    origin,
    {
      lat: origin.lat + (destination.lat - origin.lat) * 0.4 + 0.002,
      lng: origin.lng + (destination.lng - origin.lng) * 0.3 - 0.001,
    },
    {
      lat: origin.lat + (destination.lat - origin.lat) * 0.7 - 0.001,
      lng: origin.lng + (destination.lng - origin.lng) * 0.8 + 0.002,
    },
    destination,
  ];

  const polyline = encodePolyline(points);

  return {
    distanceMeters,
    distanceKm,
    durationSeconds,
    durationMinutes,
    polyline,
    steps: [
      {
        instruction: "เริ่มต้นเดินทางจากจุดมุ่งหมาย",
        distanceMeters: Math.round(distanceMeters * 0.4),
        durationSeconds: Math.round(durationSeconds * 0.4),
      },
      {
        instruction: "มุ่งหน้าตามทางหลวงนิคมอุตสาหกรรม",
        distanceMeters: Math.round(distanceMeters * 0.6),
        durationSeconds: Math.round(durationSeconds * 0.6),
      },
    ],
  };
}
