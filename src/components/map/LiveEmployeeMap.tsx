"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Navigation, Layers, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLongdoMap } from "@/hooks/useLongdoMap";

interface EmployeeMarkerData {
  id: string;
  name: string;
  siteName: string;
  lat: number;
  lng: number;
  status: "WORKING" | "LATE" | "MISSING" | "OFF";
  lastSeen: string;
}

interface SiteData {
  name: string;
  lat: number;
  lng: number;
  radius: number; // meters
  color: string;
}

interface LiveEmployeeMapProps {
  employees?: EmployeeMarkerData[];
  sites?: SiteData[];
}

const defaultEmployees: EmployeeMarkerData[] = [
  { id: "1", name: "สมชาย เข็มกลัด", siteName: "โรงงาน AAM เหมราช ระยอง", lat: 13.0039, lng: 101.1668, status: "WORKING", lastSeen: "07:55 น." },
  { id: "2", name: "พัดมา วงค์คำ", siteName: "อมตะ ซิตี้ ระยอง", lat: 12.975, lng: 101.135, status: "LATE", lastSeen: "08:14 น." },
  { id: "3", name: "วิชัย ใจดี", siteName: "สำนักงานใหญ่ ปลวกแดง", lat: 12.9734, lng: 101.2155, status: "WORKING", lastSeen: "07:48 น." },
  { id: "4", name: "นารี รุ่งเรือง", siteName: "โรงงาน BAT นิคมฯ เหมราช", lat: 12.9961, lng: 101.1712, status: "WORKING", lastSeen: "07:52 น." },
  { id: "5", name: "สร้อยทอง ดีมาก", siteName: "อมตะ ซิตี้ ระยอง", lat: 12.9765, lng: 101.137, status: "MISSING", lastSeen: "ยังไม่ลงชื่อออก" },
  { id: "6", name: "ปณิธาน สดใส", siteName: "ท่าเรือแหลมฉบัง LCIT", lat: 13.0827, lng: 100.8845, status: "WORKING", lastSeen: "07:40 น." },
];

const defaultSites: SiteData[] = [
  { name: "นิคมฯ เหมราช ระยอง", lat: 13.0039, lng: 101.1668, radius: 500, color: "#10b981" },
  { name: "อมตะ ซิตี้ ระยอง", lat: 12.975, lng: 101.135, radius: 400, color: "#6366f1" },
  { name: "อีสเทิร์นซีบอร์ด ปลวกแดง", lat: 12.9734, lng: 101.2155, radius: 350, color: "#f59e0b" },
  { name: "ท่าเรือแหลมฉบัง", lat: 13.0827, lng: 100.8845, radius: 600, color: "#3b82f6" },
];

export function LiveEmployeeMap({
  employees = defaultEmployees,
  sites = defaultSites,
}: LiveEmployeeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedEmp, setSelectedEmp] = useState<EmployeeMarkerData | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showGeofence, setShowGeofence] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { isLoaded, isError } = useLongdoMap();

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = new longdo.Map({
      placeholder: mapContainerRef.current,
      language: "th",
    });

    // Set initial view
    map.location({ lon: 101.15, lat: 13.0 }, true);
    map.zoom(11, true);

    // Hide UI components not needed
    map.Ui.DPad.visible(false);
    map.Ui.Zoombar.visible(true);
    map.Ui.LayerSelector.visible(false);
    map.Ui.Geolocation.visible(true);
    map.Ui.Toolbar.visible(false);
    map.Ui.Scale.visible(true);
    map.Ui.Crosshair.visible(false);

    mapInstanceRef.current = map;
  }, [isLoaded]);

  // Update markers when employees/filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => map.Overlays.remove(m));
    markersRef.current = [];

    const filtered = employees.filter((e) =>
      filterStatus === "ALL" ? true : e.status === filterStatus
    );

    filtered.forEach((emp) => {
      const color =
        emp.status === "WORKING" ? "#10b981" : emp.status === "LATE" ? "#f59e0b" : "#f43f5e";

      const statusLabel =
        emp.status === "WORKING" ? "ปกติ" : emp.status === "LATE" ? "มาสาย" : "ไม่ลงชื่อออก";

      const markerHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.3))">
          <div style="background:${color};width:32px;height:32px;border-radius:9999px;border:2.5px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:15px;font-weight:bold;">
            👤
          </div>
          <div style="background:rgba(15,23,42,0.9);color:white;padding:2px 7px;border-radius:4px;font-size:9px;font-weight:bold;margin-top:2px;white-space:nowrap;border:1px solid rgba(255,255,255,0.15);">
            ${emp.name}
          </div>
        </div>
      `;

      const marker = new longdo.Marker(
        { lon: emp.lng, lat: emp.lat },
        {
          icon: {
            html: markerHtml,
            offset: { x: 16, y: 40 },
          },
          popup: {
            title: emp.name,
            detail: `
              <div style="font-family:sans-serif;min-width:180px;padding:4px 0">
                <div style="font-size:11px;color:#64748b;margin-bottom:6px">${emp.siteName}</div>
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>
                  <span style="font-size:12px;font-weight:bold;color:${color}">${statusLabel}</span>
                  <span style="font-size:11px;color:#94a3b8">(${emp.lastSeen})</span>
                </div>
              </div>
            `,
          },
          clickable: true,
        }
      );

      map.Overlays.add(marker);
      markersRef.current.push(marker);
    });
  }, [employees, filterStatus, isLoaded]);

  // Geofence circles
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = mapInstanceRef.current;

    // Clear old circles
    circlesRef.current.forEach((c) => map.Overlays.remove(c));
    circlesRef.current = [];

    if (!showGeofence) return;

    sites.forEach((site) => {
      const circle = new longdo.Circle(
        { lon: site.lng, lat: site.lat },
        site.radius,
        {
          title: site.name,
          lineWidth: 2,
          lineColor: site.color,
          fillColor: site.color + "22", // transparent fill
        }
      );
      map.Overlays.add(circle);
      circlesRef.current.push(circle);
    });
  }, [sites, showGeofence, isLoaded]);

  // Traffic layer toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = mapInstanceRef.current;
    if (showTraffic) {
      map.Layers.add(longdo.Layers.TRAFFIC);
    } else {
      map.Layers.remove(longdo.Layers.TRAFFIC);
    }
  }, [showTraffic, isLoaded]);

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapInstanceRef.current || !searchQuery.trim() || !isLoaded) return;
    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = mapInstanceRef.current;
    map.Search.search(searchQuery, {
      area: 15, // Thailand
    });
  };

  const filteredEmployees = employees.filter((e) =>
    filterStatus === "ALL" ? true : e.status === filterStatus
  );

  const stats = {
    total: employees.length,
    working: employees.filter((e) => e.status === "WORKING").length,
    late: employees.filter((e) => e.status === "LATE").length,
    missing: employees.filter((e) => e.status === "MISSING").length,
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-content-primary text-base">
              แผนที่กำลังพลเรียลไทม์ (Live Operations Map)
            </h3>
          </div>
          <p className="text-xs text-content-muted mt-0.5">
            Longdo Map API — แสดงตำแหน่งพนักงานและ Geofence รอบสถานที่
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-2.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            ✓ ปกติ {stats.working}
          </span>
          <span className="px-2.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
            ⚠ สาย {stats.late}
          </span>
          <span className="px-2.5 py-1.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
            ✗ ขาด {stats.missing}
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center flex-1 min-w-[200px] gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted" />
            <input
              id="map-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาสถานที่..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-xl focus:outline-none focus:border-brand-500 text-content-primary placeholder:text-content-muted"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-500 transition-colors"
          >
            ค้นหา
          </button>
        </form>

        {/* Toggle Traffic */}
        <button
          id="toggle-traffic-btn"
          onClick={() => setShowTraffic(!showTraffic)}
          className={cn(
            "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
            showTraffic
              ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
              : "bg-surface-subtle text-content-secondary border-surface-border hover:border-rose-400"
          )}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>จราจร</span>
        </button>

        {/* Toggle Geofence */}
        <button
          id="toggle-geofence-btn"
          onClick={() => setShowGeofence(!showGeofence)}
          className={cn(
            "flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all",
            showGeofence
              ? "bg-brand-500/10 text-brand-600 border-brand-500/30"
              : "bg-surface-subtle text-content-secondary border-surface-border hover:border-brand-400"
          )}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Geofence</span>
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto pb-1">
        {[
          { key: "ALL", label: "ทั้งหมด", count: stats.total },
          { key: "WORKING", label: "ปกติ", count: stats.working },
          { key: "LATE", label: "มาสาย", count: stats.late },
          { key: "MISSING", label: "ไม่ลงชื่อ", count: stats.missing },
        ].map((f) => (
          <button
            key={f.key}
            id={`filter-status-${f.key.toLowerCase()}`}
            onClick={() => setFilterStatus(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-full border transition-all whitespace-nowrap flex items-center gap-1.5",
              filterStatus === f.key
                ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                : "bg-surface-subtle text-content-secondary border-surface-border hover:bg-surface-subtle/80"
            )}
          >
            {f.label}
            <span
              className={cn(
                "text-[10px] px-1.5 py-0 rounded-full",
                filterStatus === f.key ? "bg-white/20" : "bg-surface-border"
              )}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Map Canvas */}
      <div className="w-full h-96 rounded-2xl relative overflow-hidden border border-surface-border">
        {/* Loading State */}
        {!isLoaded && !isError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900">
            <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-medium">กำลังโหลด Longdo Map...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900">
            <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-xs text-slate-400">ไม่สามารถโหลดแผนที่ได้</p>
          </div>
        )}

        {/* Longdo Map container */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Map Attribution Badge */}
        <div className="absolute bottom-2 left-2 z-10 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm">
          Longdo Map API © Metamedia Technology
        </div>
      </div>

      {/* Selected Employee Info */}
      {selectedEmp && (
        <div className="p-3 bg-surface-subtle rounded-2xl border border-surface-border flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-content-primary">{selectedEmp.name}</span>
            <span className="text-content-muted ml-2">ประจำที่ {selectedEmp.siteName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-bold px-2 py-0.5 rounded-full text-[10px]",
                selectedEmp.status === "WORKING"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : selectedEmp.status === "LATE"
                  ? "bg-amber-500/10 text-amber-600"
                  : "bg-rose-500/10 text-rose-600"
              )}
            >
              {selectedEmp.status === "WORKING" ? "ปกติ" : selectedEmp.status === "LATE" ? "มาสาย" : "ไม่ลงชื่อออก"}
              {" "}({selectedEmp.lastSeen})
            </span>
            <button
              onClick={() => setSelectedEmp(null)}
              className="p-0.5 rounded-full text-content-muted hover:text-content-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filteredEmployees.map((emp) => {
          const color =
            emp.status === "WORKING"
              ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
              : emp.status === "LATE"
              ? "text-amber-600 bg-amber-500/10 border-amber-500/20"
              : "text-rose-600 bg-rose-500/10 border-rose-500/20";

          return (
            <button
              key={emp.id}
              id={`emp-list-${emp.id}`}
              onClick={() => {
                setSelectedEmp(emp);
                // Pan map to employee
                if (mapInstanceRef.current && isLoaded) {
                  const longdo = (window as any).longdo;
                  if (longdo) {
                    mapInstanceRef.current.location({ lon: emp.lng, lat: emp.lat }, true);
                    mapInstanceRef.current.zoom(15, true);
                  }
                }
              }}
              className="flex items-center gap-3 p-2.5 bg-surface-subtle rounded-xl border border-surface-border hover:border-brand-400 transition-all text-left"
            >
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 border", color)}>
                👤
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-content-primary truncate">{emp.name}</div>
                <div className="text-[10px] text-content-muted truncate">{emp.siteName}</div>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0", color)}>
                {emp.status === "WORKING" ? "ปกติ" : emp.status === "LATE" ? "สาย" : "ขาด"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
