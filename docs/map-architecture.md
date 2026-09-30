# Longdo Map Central Architecture Document

**System**: SmartOP / SmartJeff Enterprise Operations Platform  
**Architecture Pattern**: Centralized Facade & Adapter Pattern

---

## 1. Directory Structure (`src/lib/longdo/`)

```
src/lib/longdo/
├── client.ts         # Browser SDK loader with Map API 3 & v2 fallback
├── server.ts         # Unified Server SDK facade exporting all REST services
├── config.ts         # Configuration, key resolution & quota counters
├── errors.ts         # Longdo error boundary & exception classes
├── geocode.ts        # Reverse Geocoding service
├── place.ts          # Place search & suggest service
├── route.ts          # Route calculation & forecast routing
├── nearby.ts         # Nearby POI query service
├── matrix.ts         # Distance Matrix REST service
├── coverage.ts       # Coverage area (isochrone polygon) calculation
├── route-planning.ts # Multi-stop TSP sequence optimizer
├── traffic.ts        # Traffic layer & incident reports
└── types.ts          # TypeScript interfaces & types
```

---

## 2. Component Layer (`src/components/map/`)

```
src/components/map/
├── SmartLongdoMap.tsx    # Reusable master Longdo Map React component
├── LiveEmployeeMap.tsx   # Live workforce tracking & geofence monitor
├── RoutePlayback.tsx     # Animated route track visualizer
├── GeofenceMap.tsx       # Geofence visualizer & legend
└── SiteMapPickerModal.tsx# Interactive location & geofence picker modal
```

---

## 3. High-Level Data Flow Architecture

```
[ Browser UI Components ]
        │
        ├── Client JS SDK (Map API 3) ──> Longdo CDN (api.longdo.com/map3/)
        │
        └── Internal API Proxy Routes (/api/map/*)
                     │
                     ▼
         [ Longdo Server SDK Facade ] (src/lib/longdo/server.ts)
                     │
                     ▼ (Server Key API Calls)
         [ Longdo REST Services ] (api.longdo.com/RouteServer/...)
```
