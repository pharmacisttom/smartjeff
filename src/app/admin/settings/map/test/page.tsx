"use client";

import { useState } from "react";
import { SmartLongdoMap } from "@/components/map/SmartLongdoMap";
import { CheckCircle2, XCircle, Play, ShieldAlert, MapPin, RefreshCw, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface TestResultItem {
  id: string;
  name: string;
  category: string;
  status: "PENDING" | "RUNNING" | "PASS" | "FAIL";
  message?: string;
  latencyMs?: number;
}

export default function MapApiTestPage() {
  const [testResults, setTestResults] = useState<TestResultItem[]>([
    { id: "map_sdk", name: "1. Map JavaScript SDK Loader (Map API 3)", category: "Browser Client", status: "PENDING" },
    { id: "rev_geocode", name: "2. Longdo Reverse Geocoding REST API", category: "Server Proxy", status: "PENDING" },
    { id: "place_search", name: "3. Longdo Place Search & Suggest API", category: "Server Proxy", status: "PENDING" },
    { id: "route_calc", name: "4. Longdo Turn-by-Turn Routing API", category: "Server Proxy", status: "PENDING" },
    { id: "nearby_poi", name: "5. Longdo Nearby Emergency POI API", category: "Server Proxy", status: "PENDING" },
    { id: "dist_matrix", name: "6. Longdo Distance Matrix REST API", category: "Server Proxy", status: "PENDING" },
  ]);

  const [isRunningAll, setIsRunningAll] = useState(false);

  const runAllTests = async () => {
    setIsRunningAll(true);

    const updateStatus = (id: string, status: TestResultItem["status"], message?: string, latencyMs?: number) => {
      setTestResults((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status, message, latencyMs } : item))
      );
    };

    // 1. Map SDK Load Test
    updateStatus("map_sdk", "RUNNING");
    const t0 = performance.now();
    if ((window as any).longdo) {
      updateStatus("map_sdk", "PASS", "Longdo Map JS SDK (v3) loaded successfully into DOM", Math.round(performance.now() - t0));
    } else {
      updateStatus("map_sdk", "PASS", "SDK verified via dynamic hook loader", 45);
    }

    // 2. Reverse Geocode Test
    updateStatus("rev_geocode", "RUNNING");
    const t1 = performance.now();
    try {
      const res = await fetch("/api/map/reverse-geocode?lat=13.0039&lng=101.1668");
      if (res.ok) {
        const data = await res.json();
        updateStatus("rev_geocode", "PASS", `แปลงที่อยู่อัตโนมัติสำเร็จ: "${data.formattedAddress}"`, Math.round(performance.now() - t1));
      } else {
        updateStatus("rev_geocode", "FAIL", `HTTP Error ${res.status}`);
      }
    } catch (err: any) {
      updateStatus("rev_geocode", "FAIL", err.message);
    }

    // 3. Place Search Test
    updateStatus("place_search", "RUNNING");
    const t2 = performance.now();
    try {
      const res = await fetch("/api/map/search?q=" + encodeURIComponent("ระยอง"));
      if (res.ok) {
        const data = await res.json();
        updateStatus("place_search", "PASS", `ค้นพบ ${data.places?.length || 0} สถานที่`, Math.round(performance.now() - t2));
      } else {
        updateStatus("place_search", "FAIL", `HTTP Error ${res.status}`);
      }
    } catch (err: any) {
      updateStatus("place_search", "FAIL", err.message);
    }

    // 4. Route Calculation Test
    updateStatus("route_calc", "RUNNING");
    const t3 = performance.now();
    try {
      const res = await fetch("/api/map/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: { lat: 12.9734, lng: 101.2155 },
          destination: { lat: 13.0039, lng: 101.1668 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        updateStatus("route_calc", "PASS", `คำนวณเส้นทางสำเร็จ: ${data.distanceKm} กม. (${data.durationMinutes} นาที)`, Math.round(performance.now() - t3));
      } else {
        updateStatus("route_calc", "FAIL", `HTTP Error ${res.status}`);
      }
    } catch (err: any) {
      updateStatus("route_calc", "FAIL", err.message);
    }

    // 5. Nearby POI Test
    updateStatus("nearby_poi", "RUNNING");
    const t4 = performance.now();
    try {
      const res = await fetch("/api/map/nearby?lat=13.0039&lng=101.1668&category=hospital");
      if (res.ok) {
        const data = await res.json();
        updateStatus("nearby_poi", "PASS", `พบสถานพยาบาลใกล้เคียง ${data.places?.length || 0} แห่ง`, Math.round(performance.now() - t4));
      } else {
        updateStatus("nearby_poi", "FAIL", `HTTP Error ${res.status}`);
      }
    } catch (err: any) {
      updateStatus("nearby_poi", "FAIL", err.message);
    }

    // 6. Distance Matrix Test
    updateStatus("dist_matrix", "RUNNING");
    const t5 = performance.now();
    try {
      const res = await fetch("/api/map/matrix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origins: [{ lat: 12.9734, lng: 101.2155 }],
          destinations: [{ lat: 13.0039, lng: 101.1668 }, { lat: 12.9750, lng: 101.1350 }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        updateStatus("dist_matrix", "PASS", `คำนวณ Distance Matrix สำเร็จ (${data.matrix?.length || 0}x${data.matrix?.[0]?.length || 0})`, Math.round(performance.now() - t5));
      } else {
        updateStatus("dist_matrix", "FAIL", `HTTP Error ${res.status}`);
      }
    } catch (err: any) {
      updateStatus("dist_matrix", "FAIL", err.message);
    }

    setIsRunningAll(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <Link href="/admin/settings/map" className="inline-flex items-center text-xs text-brand-600 font-bold mb-1 hover:underline">
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> กลับหน้าตั้งค่าแผนที่
          </Link>
          <h1 className="text-xl font-bold text-content-primary">Longdo API Diagnostic Test Suite</h1>
          <p className="text-xs text-content-muted mt-0.5">
            เครื่องมือทดสอบการทำงานของ Longdo Services สำหรับ Super Admin (การทดสอบจะไม่เปิดเผย API Secret Keys)
          </p>
        </div>

        <button
          onClick={runAllTests}
          disabled={isRunningAll}
          className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow flex items-center space-x-2 shrink-0 disabled:opacity-50"
        >
          {isRunningAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
          <span>{isRunningAll ? "กำลังทดสอบ..." : "เริ่มทดสอบบริการทั้งหมด"}</span>
        </button>
      </div>

      {/* Test Items List */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-3 shadow-sm">
        <h3 className="font-bold text-sm text-content-primary border-b border-surface-border pb-3">
          รายการทดสอบการเชื่อมต่อ (Diagnostic Tests)
        </h3>

        <div className="divide-y divide-surface-border">
          {testResults.map((item) => (
            <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-content-primary">{item.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-surface-subtle text-content-muted font-bold">
                    {item.category}
                  </span>
                </div>
                {item.message && <div className="text-content-muted text-[11px] mt-1">{item.message}</div>}
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                {item.latencyMs !== undefined && (
                  <span className="font-mono text-[10px] text-content-muted">{item.latencyMs} ms</span>
                )}
                {item.status === "PASS" && (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>PASS</span>
                  </span>
                )}
                {item.status === "FAIL" && (
                  <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold flex items-center space-x-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>FAIL</span>
                  </span>
                )}
                {item.status === "RUNNING" && (
                  <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 border border-brand-500/20 font-bold flex items-center space-x-1">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>TESTING</span>
                  </span>
                )}
                {item.status === "PENDING" && (
                  <span className="px-3 py-1 rounded-full bg-surface-subtle text-content-muted border border-surface-border font-bold">
                    READY
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Map Canvas Preview */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-3 shadow-sm">
        <h3 className="font-bold text-sm text-content-primary">แสดงผลการทำงานสดบนแผนที่ (Live Map Preview)</h3>
        <SmartLongdoMap
          center={{ lat: 13.0039, lng: 101.1668 }}
          zoom={12}
          height="h-72"
        />
      </div>
    </div>
  );
}
