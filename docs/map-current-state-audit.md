# Longdo Map & Operations GIS Architecture Audit Report

**System**: SmartOP / SmartJeff Enterprise Operations Platform  
**Target Repository**: `pharmacisttom/smartjeff` (main branch)  
**Date**: September 2026  
**Auditor**: Senior Next.js / TypeScript / GIS / Fleet Operations Engineer

---

## Executive Summary

An exhaustive audit of the SmartOP codebase was conducted to evaluate current map integration capabilities, GIS helpers, location data schemas, UI components, and API endpoint implementations.

The current system relies on basic initial integration of the **Longdo Map JavaScript API (v2 script loader)** with hard-coded API keys, mock datasets, and missing REST proxy integration. Critical operations modules (Dispatch, Auto-Assign, Routing, Fleet, Attendance, and QHSE Incidents) either rely on Euclidean Haversine approximation or lack dynamic Longdo API services entirely.

---

## 1. Existing Map Components

| Component | Path | Current State & Vulnerabilities |
|---|---|---|
| `useLongdoMap` | `src/hooks/useLongdoMap.ts` | **HARD-CODED API KEY** (`a17a7f79ad9e58f7897adb8a2896c7bb`). Injects script tag directly into DOM. Lacks fallback, dynamic key loading, Map API 3 support, and request cancellation. |
| `LiveEmployeeMap` | `src/components/map/LiveEmployeeMap.tsx` | Uses mock employee location data (`defaultEmployees`). Overlays simple markers and circles. Missing marker clustering for high density, missing live WebSocket/REST sync, and missing mobile bottom-sheet UI. |
| `GeofenceMap` | `src/components/map/GeofenceMap.tsx` | Embedded circular geofence renderer with mock site lists. Lacks interactive circle editing, polygon support, and geofence boundary distance calculations. |
| `RoutePlayback` | `src/components/map/RoutePlayback.tsx` | UI-only mock progress bar. Does **not** render actual map polyline or animate marker along real recorded route timestamps. |
| `ExecutiveSiteMap` | `src/components/admin/ExecutiveSiteMap.tsx` | Large executive map component with estate filtering and drawer. Lacks central API integration, relies on hardcoded Rayong-Chonburi bounding coordinates, lacks Heatmap mode and 3D visualization. |

---

## 2. Existing GIS & Geo APIs / Helpers

| Module | Path | Implementation Details & Missing Capabilities |
|---|---|---|
| `haversineDistance` | `src/lib/geo/haversine.ts` | Calculates 2D Euclidean great-circle distance in meters. Useful for local client-side checks, but insufficient for actual road distance. |
| `calculateRoute` | `src/lib/geo/directions.ts` | **CRITICAL ROUTE BUG**: Uses `haversineDistance * 1.25` synthetic factor and encoded polyline mock instead of Longdo Route REST API. Returns fake turn instructions. |
| `autoAssignWorkforce` | `src/lib/operations/auto-assign.ts` | Calculates distance based solely on Haversine straight lines. Missing multi-criteria weighting (skill, travel time from Distance Matrix, workload, shift availability). |

---

## 3. Hard-Coded Data & Key Security Audit

- **API Key Leak**: `src/hooks/useLongdoMap.ts` line 5 contains plaintext key: `a17a7f79ad9e58f7897adb8a2896c7bb`.
- **Mock Coordinates**: Rayong & Maptaphut industrial coordinates are hard-coded in default prop values across 4 map components (`13.0039, 101.1668`, `12.975, 101.135`).
- **No Server Secret Protection**: Zero backend REST proxy endpoints exist for Longdo Place Search, Reverse Geocoding, Route, Nearby, Distance Matrix, Coverage, or Traffic.

---

## 4. Missing Longdo Capabilities (To Be Integrated)

1. **Map API 3 / Vector Tiles**: Smoother vector rendering, custom styles, interactive cluster markers, 3D building/terrain capabilities.
2. **Reverse Geocoding REST API**: `https://api.longdo.com/map/services/address` - Converting lat/lng into structured Thai address (subdistrict, district, province, postcode).
3. **Place Search & Suggest API**: `https://api.longdo.com/map/services/search` - Autocomplete place search box on all map interfaces.
4. **Nearby POI API**: Searching nearby emergency/essential POIs (hospitals, police stations, fuel stations, logistics hubs).
5. **Route & Forecast Routing API**: `https://api.longdo.com/RouteServer/getRoute` - Real turn-by-turn routing with traffic forecast parameters.
6. **Distance Matrix API**: Multi-origin / multi-destination road matrix calculation for workforce auto-assignment.
7. **Coverage Area API**: Isochrone travel-time and distance polygon calculation for service radius.
8. **Heatmap Layer**: Kernel density visualization for incidents, work orders, and attendance check-ins.
9. **Drawing Tools & Polygon Geofence**: Custom site boundary creation outputting standard GeoJSON formats.

---

## 5. Duplicate & Missing Map Routes (404 Audit)

- **Route Discrepancy**: Next.js route `/admin/operations/map` was returning **404** because `src/app/(admin)/operations/map/page.tsx` was under the `(admin)` route group without matching the canonical `/admin/operations/map` path expected by admin sidebar navigation.
- **Missing Admin Map Settings & Test Pages**:
  - `/admin/settings/map` (Quota & Provider configuration) - Missing
  - `/admin/settings/map/test` (Super Admin Live API Diagnostics) - Missing
- **Missing Operational Command Center Route**:
  - `/admin/operations/map` (Canonical Operational Command Center with Left Filter + Map + Right Panel) - Needs full unification.

---

## 6. Action Plan for Phase 2 – 55 Implementation

1. **Centralize SDK & Integration Layer**: Construct `src/lib/longdo/` with modular TypeScript SDKs for Client JS API, Server REST API, Type definitions, and Error boundary handling.
2. **Implement REST Proxy & Cache**: Build `/api/map/*` endpoints with rate limiting, quota protection, and response caching.
3. **Build SmartLongdoMap Component**: Modern React map wrapper with Map API 3 / Vector tile support, fallback to API 2, clustering, drawing tools, and layer switching.
4. **Deep Operational Integration**:
   - Site Management (Address lookup + Geofence editor)
   - Attendance Verification (Geofence validation + Map audit)
   - Auto-Assign & Distance Matrix (Optimized routing & scoring)
   - Route Playback (Timestamp-based animation along Longdo route polyline)
   - QHSE & Incident Map (SOS radar & Heatmap)
   - Dispatch Command Center (`/admin/operations/map`)
5. **API Quota & Monitoring**: Implement `/admin/settings/map` and live diagnostic page `/admin/settings/map/test`.
