# Longdo Map Enterprise Integration Guide

**System**: SmartOP / SmartJeff Enterprise Operations Platform  
**Map Engine**: Longdo Map JS SDK v3 / Map API 3 (Vector Tiles & WebGL) + Longdo REST Web Services  
**Target Domain**: `smartop.tomvisolution.tech`

---

## 1. Overview & Capability Mapping

SmartOP integrates Longdo Map as its core GIS intelligence engine across 17 operations domains:

1. **Site Management**: Reverse geocodes marker drops & searches to populate Thai administrative metadata (subdistrict, district, province, postcode).
2. **Employee Location**: Live workforce tracking map with status markers (On Duty, Late, Outside Geofence).
3. **Workforce Planning & Auto-Assign**: Distance Matrix REST API combined with multi-criteria weighted scoring (Skill 35%, Availability 25%, Travel Time 20%, Workload 10%, Site Familiarity 10%).
4. **Dispatch**: Real-time road routing (`/RouteServer/getRoute`) with turn-by-turn guidance and ETA calculations.
5. **Vehicle & Fleet Management**: Live vehicle GPS telemetry monitoring, trip speed tracking, and status filtering.
6. **Route Planning**: Multi-stop TSP (Traveling Salesperson Problem) sequence optimization comparing unoptimized vs optimized mileage savings.
7. **Route Playback**: Animated polyline track playback with speed controls (1x, 2x, 4x) and timeline scrubbers.
8. **Geofence Engine**: Interactive circular radius and polygon boundary check algorithms with boundary distance computation.
9. **Attendance Verification**: Check-in vs Site Geofence validation.
10. **Field Operations**: Work Order mapping and team dispatch.
11. **Incident & QHSE**: SOS emergency radar markers, affected radius visualization, and incident density heatmap.
12. **Client & Project Map**: Nationwide project site overview for executive leadership.
13. **Nearby POIs**: Query essential emergency POIs (hospitals, police stations, fuel stations, logistics hubs).
14. **Traffic Layer**: Live Longdo Traffic overlay integration.
15. **Forecast Routing**: Traffic-influenced ETA calculations for scheduled departures.
16. **Coverage Area (Isochrone)**: Travel time (e.g. 15, 30, 60 mins) and distance polygon generation.
17. **Operational Command Center**: `/admin/operations/map` layout featuring Left Filters, Center Longdo Canvas, and Right Operational Panel.

---

## 2. API Keys & Environment Configuration

Configure environment variables in `.env` (never commit private keys to git):

```env
# Browser Public Key (Used strictly in client-side Longdo Map SDK)
NEXT_PUBLIC_LONGDO_MAP_KEY=a17a7f79ad9e58f7897adb8a2896c7bb

# Server Secret Key (Used strictly inside server-side API proxy routes /api/map/*)
LONGDO_API_KEY=a17a7f79ad9e58f7897adb8a2896c7bb

# Feature Toggles & Quota Warning Thresholds
LONGDO_MAP_ENABLED=true
LONGDO_USAGE_WARNING_THRESHOLD=80
```

---

## 3. Server API Proxy Routes & Quota Protection

All server-side REST calls to Longdo Web Services pass through secure internal Next.js API endpoints (`/api/map/*`), ensuring private keys are never exposed to browser context:

- `GET /api/map/reverse-geocode?lat={lat}&lng={lng}`
- `GET /api/map/search?q={keyword}&lat={lat}&lng={lng}`
- `GET /api/map/suggest?q={keyword}`
- `POST /api/map/route` (Calculates turn-by-turn route)
- `GET /api/map/nearby?lat={lat}&lng={lng}&category={category}`
- `POST /api/map/matrix` (Calculates distance matrix)
- `GET /api/map/coverage?lat={lat}&lng={lng}&value={value}&mode={mode}`
- `GET /api/map/stats` (Quota monitoring dashboard statistics)

---

## 4. Compliance & Terms of Use

1. **No Scraping or Offline Caching**: Map tiles and POI content are dynamically fetched in real time.
2. **Key Protection**: Server REST secret keys are strictly bounded to backend operations.
3. **Privacy Enforcement**: Employee GPS telemetry is scoped under RBAC permissions (`operations.location.read`).
