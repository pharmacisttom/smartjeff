# Longdo Map Intelligence Platform — Demo & Testing Guide

**System**: SmartOP / SmartJeff Enterprise Operations Platform  

---

## 1. How to Test Map Capabilities

1. **GIS Operations Command Center**:
   - Navigate to `/admin/operations/map`
   - Test left filter panel by switching status pills (All, Normal, Alert).
   - Click on site radar items on the right panel to pan map to exact coordinates.
   - Toggle Satellite / Normal layer mode or Traffic layer.

2. **Site Location Picker with Reverse Geocoding**:
   - Open any site modal or launch `/admin/sites`
   - Click on the map picker button to launch `SiteMapPickerModal`.
   - Click anywhere on the map to trigger automated Longdo Reverse Geocoding and auto-fill address details.
   - Adjust the Geofence radius slider (50m, 100m, 200m, 500m) to preview boundary ring.

3. **Live Employee Tracking & Geofence Verification**:
   - Access `/admin/operations`
   - View live employee location markers and geofence boundary rings.
   - Filter employees by status (Working, Late, Outside Geofence).

4. **Animated Route Playback**:
   - View Route Playback section on operations dashboard.
   - Press **Play** to animate vehicle marker along calculated polyline route.
   - Adjust playback speed multiplier (1x, 2x, 4x) or drag timeline slider.

5. **Map Quota & Live Diagnostic Test Suite**:
   - Navigate to `/admin/settings/map` for quota counters and provider statistics.
   - Navigate to `/admin/settings/map/test` (Super Admin Only).
   - Click **"เริ่มทดสอบบริการทั้งหมด"** to execute 6 live PASS/FAIL diagnostic API tests.
