"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Shield,
  Users,
  Clock,
  Phone,
  Maximize2,
  Minimize2,
  Navigation,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Search,
  Layers,
  ExternalLink,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useLongdoMap } from "@/hooks/useLongdoMap";

export interface SiteOperationalData {
  id: string;
  code: string;
  name: string;
  estateName: string;
  location: string;
  lat: number;
  lng: number;
  radius: number;
  workHours: string;
  otHours: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  targetHeadcount: number;
  actualOnDuty: number;
  attendanceRate: number;
  reliefCount: number;
  outsideGeofenceCount: number;
  lateCount: number;
  laborCost: number;
  status: "NORMAL" | "WARNING" | "ALERT";
  activeWorkers?: Array<{
    id: string;
    code: string;
    name: string;
    position: string;
    checkInTime: string;
    isWithinGeofence: boolean;
    status: string;
  }>;
}

interface ExecutiveSiteMapProps {
  sites: SiteOperationalData[];
  sosIncidents?: any[];
  onSelectSite?: (site: SiteOperationalData) => void;
  selectedSiteId?: string | null;
}

export function ExecutiveSiteMap({
  sites,
  sosIncidents = [],
  onSelectSite,
  selectedSiteId,
}: ExecutiveSiteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const sosMarkersRef = useRef<any[]>([]);

  const [activeSite, setActiveSite] = useState<SiteOperationalData | null>(null);
  const [mapLayerMode, setMapLayerMode] = useState<"normal" | "satellite">("normal");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEstate, setSelectedEstate] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRadarList, setShowRadarList] = useState(true);

  const { isLoaded, isError } = useLongdoMap();

  // Extract unique industrial estates
  const estates = ["ALL", ...Array.from(new Set(sites.map((s) => s.estateName).filter(Boolean)))];

  // Filtered sites
  const filteredSites = sites.filter((site) => {
    const matchesSearch =
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.estateName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEstate = selectedEstate === "ALL" || site.estateName === selectedEstate;
    const matchesStatus = selectedStatus === "ALL" || site.status === selectedStatus;
    return matchesSearch && matchesEstate && matchesStatus;
  });

  // Initialize Longdo Map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = new longdo.Map({
      placeholder: mapContainerRef.current,
      language: "th",
    });

    map.location({ lon: 101.1668, lat: 13.0039 }, true);
    map.zoom(11, true);

    // Minimal UI
    map.Ui.DPad.visible(false);
    map.Ui.Zoombar.visible(true);
    map.Ui.LayerSelector.visible(false);
    map.Ui.Geolocation.visible(false);
    map.Ui.Toolbar.visible(false);
    map.Ui.Scale.visible(true);
    map.Ui.Crosshair.visible(false);

    mapInstanceRef.current = map;
  }, [isLoaded]);

  // Toggle satellite / normal layer
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = mapInstanceRef.current;
    if (mapLayerMode === "satellite") {
      map.Layers.setBase(longdo.Layers.SATELLITE);
    } else {
      map.Layers.setBase(longdo.Layers.NORMAL);
    }
  }, [mapLayerMode, isLoaded]);

  // Render Markers + Geofence Circles
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = mapInstanceRef.current;

    // Clear previous overlays
    markersRef.current.forEach((m) => map.Overlays.remove(m));
    circlesRef.current.forEach((c) => map.Overlays.remove(c));
    sosMarkersRef.current.forEach((s) => map.Overlays.remove(s));
    markersRef.current = [];
    circlesRef.current = [];
    sosMarkersRef.current = [];

    if (!filteredSites || filteredSites.length === 0) return;

    filteredSites.forEach((site) => {
      if (!site.lat || !site.lng) return;

      const isHQ = site.code.includes("HQ");
      const isSelected = activeSite?.id === site.id || selectedSiteId === site.id;

      let circleFill = "#10b981";
      let markerBg = "#10b981";
      if (isHQ) {
        circleFill = "#3b82f6";
        markerBg = "#3b82f6";
      } else if (site.status === "ALERT" || site.outsideGeofenceCount > 0) {
        circleFill = "#f43f5e";
        markerBg = "#f43f5e";
      } else if (site.status === "WARNING" || site.actualOnDuty < site.targetHeadcount) {
        circleFill = "#f59e0b";
        markerBg = "#f59e0b";
      }

      // Geofence Circle
      const circle = new longdo.Circle(
        { lon: site.lng, lat: site.lat },
        site.radius || 200,
        {
          title: site.name,
          lineWidth: isSelected ? 2.5 : 1.5,
          lineColor: circleFill,
          fillColor: circleFill + (isSelected ? "33" : "15"),
        }
      );
      map.Overlays.add(circle);
      circlesRef.current.push(circle);

      // Site Marker
      const hasAlert = site.outsideGeofenceCount > 0;
      const markerHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.35))">
          <div style="position:relative;width:${isSelected ? 40 : 34}px;height:${isSelected ? 40 : 34}px;border-radius:12px;background:${markerBg};border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:9px;color:white;transition:all 0.2s;${isSelected ? 'box-shadow:0 0 0 4px rgba(255,255,255,0.4);' : ''}">
            ${site.code.substring(0, 3)}
            ${hasAlert ? `<span style="position:absolute;top:-5px;right:-5px;width:14px;height:14px;border-radius:50%;background:#dc2626;border:2px solid white;font-size:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;">!</span>` : ""}
          </div>
          <div style="margin-top:2px;padding:2px 6px;border-radius:5px;background:rgba(15,23,42,0.9);color:white;font-size:9px;font-weight:700;white-space:nowrap;border:1px solid rgba(255,255,255,0.15);">
            ${site.code} • ${site.actualOnDuty}/${site.targetHeadcount}
          </div>
        </div>
      `;

      const popupDetail = `
        <div style="font-family:sans-serif;min-width:220px;padding:4px 0">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:6px;">
            <span style="font-size:11px;font-weight:800;color:#1e293b">${site.code}</span>
            <span style="font-size:10px;font-weight:700;padding:2px 6px;border-radius:9999px;background:${
              site.status === "ALERT" ? "#fee2e2;color:#b91c1c" : site.status === "WARNING" ? "#fef3c7;color:#b45309" : "#dcfce7;color:#15803d"
            };">${site.status === "ALERT" ? "แจ้งเตือน" : site.status === "WARNING" ? "เฝ้าระวัง" : "ปกติ"}</span>
          </div>
          <div style="font-size:12px;font-weight:700;color:#0f172a;margin-bottom:4px">${site.name}</div>
          <div style="font-size:10px;color:#64748b;margin-bottom:8px">${site.estateName || site.location}</div>
          <div style="background:#f8fafc;border-radius:8px;padding:6px 8px;display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;margin-bottom:8px">
            <div>
              <span style="font-size:9px;color:#94a3b8;display:block">กำลังพลปฏิบัติงาน</span>
              <strong style="color:#0f172a">${site.actualOnDuty} / ${site.targetHeadcount} คน</strong>
            </div>
            <div>
              <span style="font-size:9px;color:#94a3b8;display:block">Geofence รัศมี</span>
              <strong style="color:#0f172a">${site.radius} เมตร</strong>
            </div>
          </div>
          <div style="font-size:10px;color:#475569">⏱️ กะ: ${site.workHours}</div>
          <div style="font-size:10px;color:#475569;margin-top:2px">📞 ผู้ดูแล: ${site.contactName} (${site.contactPhone})</div>
        </div>
      `;

      const marker = new longdo.Marker(
        { lon: site.lng, lat: site.lat },
        {
          icon: {
            html: markerHtml,
            offset: { x: 17, y: 50 },
          },
          popup: {
            title: site.name,
            detail: popupDetail,
          },
          clickable: true,
        }
      );

      map.Overlays.add(marker);
      markersRef.current.push(marker);

      // Click event
      longdo.Event.bind(marker, "click", () => {
        setActiveSite(site);
        if (onSelectSite) onSelectSite(site);
      });
    });

    // SOS Incident markers
    if (sosIncidents && sosIncidents.length > 0) {
      sosIncidents.forEach((sos) => {
        if (sos.status === "RESOLVED" || sos.status === "CLOSED") return;
        let lat = 12.6828;
        let lng = 101.2813;
        try {
          if (sos.photoUrls) {
            const parsed = JSON.parse(sos.photoUrls);
            if (parsed.lat && parsed.lng) {
              lat = parsed.lat;
              lng = parsed.lng;
            }
          }
        } catch (_) {}

        const sosHtml = `
          <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
            <span style="position:absolute;width:44px;height:44px;border-radius:9999px;background:rgba(239,68,68,0.35);animation:ping 1.2s cubic-bezier(0,0,0.2,1) infinite"></span>
            <div style="position:relative;width:34px;height:34px;border-radius:9999px;background:#dc2626;border:2.5px solid white;box-shadow:0 0 16px rgba(220,38,38,0.9);display:flex;align-items:center;justify-content:center;font-size:16px;">🚨</div>
          </div>
        `;

        const sosMarker = new longdo.Marker(
          { lon: lng, lat: lat },
          {
            icon: { html: sosHtml, offset: { x: 22, y: 22 } },
            popup: {
              title: "🚨 SOS ฉุกเฉิน",
              detail: `
                <div style="font-family:sans-serif;min-width:200px;">
                  <div style="font-weight:700;color:#0f172a;margin-bottom:4px">${sos.title}</div>
                  <div style="font-size:11px;color:#475569">ผู้แจ้ง: <b>${sos.affectedPerson || "-"}</b></div>
                  <div style="font-size:10px;color:#64748b;margin-top:2px">พิกัด: ${sos.location || "-"}</div>
                  <div style="font-size:10px;color:#64748b;margin-top:2px">เวลา: ${new Date(sos.occurredAt || sos.createdAt).toLocaleTimeString("th-TH")}</div>
                </div>
              `,
            },
            clickable: true,
          }
        );
        map.Overlays.add(sosMarker);
        sosMarkersRef.current.push(sosMarker);
      });
    }

    // Auto-fit bounds
    if (!selectedSiteId && filteredSites.length > 1) {
      const validSites = filteredSites.filter((s) => s.lat && s.lng);
      if (validSites.length > 0) {
        const minLat = Math.min(...validSites.map((s) => s.lat));
        const maxLat = Math.max(...validSites.map((s) => s.lat));
        const minLon = Math.min(...validSites.map((s) => s.lng));
        const maxLon = Math.max(...validSites.map((s) => s.lng));
        const longdo = (window as any).longdo;
        if (longdo) {
          mapInstanceRef.current.bound({
            minLon: minLon - 0.05,
            maxLon: maxLon + 0.05,
            minLat: minLat - 0.05,
            maxLat: maxLat + 0.05,
          });
        }
      }
    }
  }, [filteredSites, sosIncidents, isLoaded, activeSite, selectedSiteId, onSelectSite]);

  // Pan to externally selected site
  useEffect(() => {
    if (!selectedSiteId || !mapInstanceRef.current || !sites || !isLoaded) return;
    const site = sites.find((s) => s.id === selectedSiteId);
    if (site && site.lat && site.lng) {
      setActiveSite(site);
      mapInstanceRef.current.location({ lon: site.lng, lat: site.lat }, true);
      mapInstanceRef.current.zoom(15, true);
    }
  }, [selectedSiteId, sites, isLoaded]);

  const handleFlyToSite = (site: SiteOperationalData) => {
    setActiveSite(site);
    if (onSelectSite) onSelectSite(site);
    if (mapInstanceRef.current && site.lat && site.lng && isLoaded) {
      mapInstanceRef.current.location({ lon: site.lng, lat: site.lat }, true);
      mapInstanceRef.current.zoom(15, true);
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current && isLoaded) {
      mapInstanceRef.current.location({ lon: 101.1668, lat: 13.0039 }, true);
      mapInstanceRef.current.zoom(11, true);
    }
  };

  return (
    <div
      className={`relative bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-xl transition-all duration-300 ${
        isFullscreen ? "fixed inset-2 sm:inset-4 z-50 rounded-2xl shadow-2xl" : "w-full"
      }`}
    >
      {/* ===== Top Control Bar ===== */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col gap-3 border-b border-white/10">
        {/* Title Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex-shrink-0">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black tracking-tight truncate">
                  GIS Operations Command
                </h2>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                  LIVE
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block truncate">
                ติดตามจุดทำงาน {sites.length} จุดในนิคมฯ ระยอง-ชลบุรี
              </p>
            </div>
          </div>

          {/* Action Buttons — Always Visible */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              id="map-reset-view-btn"
              onClick={handleResetView}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title="รีเซ็ตมุมมอง"
            >
              <Navigation className="w-3.5 h-3.5" />
            </button>
            <button
              id="map-toggle-list-btn"
              onClick={() => setShowRadarList(!showRadarList)}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                showRadarList ? "bg-white text-slate-900 border-white" : "bg-white/10 text-white border-white/10 hover:bg-white/20"
              }`}
              title="แผงรายการไซต์"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              id="map-fullscreen-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title={isFullscreen ? "ย่อ" : "เต็มจอ"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[140px]">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="map-search-site-input"
              type="text"
              placeholder="ค้นหาไซต์..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
            />
          </div>

          {/* Estate Filter */}
          <select
            id="map-estate-filter"
            value={selectedEstate}
            onChange={(e) => setSelectedEstate(e.target.value)}
            className="px-2 py-1.5 rounded-xl bg-white/10 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs cursor-pointer flex-shrink-0 max-w-[130px]"
          >
            <option value="ALL" className="bg-slate-900 text-white">นิคมฯ ทั้งหมด</option>
            {estates.filter((e) => e !== "ALL").map((est) => (
              <option key={est} value={est} className="bg-slate-900 text-white">{est}</option>
            ))}
          </select>

          {/* Status Filter Pills */}
          <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10 font-bold text-[11px] flex-shrink-0">
            {[
              { key: "ALL", label: "ทั้งหมด" },
              { key: "NORMAL", label: "ปกติ", activeClass: "bg-emerald-500 text-white", inactiveClass: "text-emerald-300" },
              { key: "ALERT", label: "เตือน", activeClass: "bg-rose-500 text-white", inactiveClass: "text-rose-300" },
            ].map((f) => (
              <button
                key={f.key}
                id={`map-status-filter-${f.key.toLowerCase()}`}
                onClick={() => setSelectedStatus(f.key)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  selectedStatus === f.key
                    ? (f.activeClass || "bg-white text-slate-950 shadow")
                    : (f.inactiveClass || "text-slate-300 hover:text-white")
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Layer Toggle */}
          <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10 text-[11px] font-bold flex-shrink-0">
            <button
              id="map-layer-normal-btn"
              onClick={() => setMapLayerMode("normal")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapLayerMode === "normal" ? "bg-brand-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              แผนที่
            </button>
            <button
              id="map-layer-satellite-btn"
              onClick={() => setMapLayerMode("satellite")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapLayerMode === "satellite" ? "bg-brand-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              ดาวเทียม
            </button>
          </div>
        </div>
      </div>

      {/* ===== Main Map + Sidebar ===== */}
      <div className="relative flex flex-col lg:flex-row h-[480px] sm:h-[520px]">
        {/* Map Canvas */}
        <div className="relative flex-1 h-full w-full min-h-[260px]">
          {/* Loading */}
          {!isLoaded && !isError && (
            <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">กำลังโหลด Longdo Map...</p>
            </div>
          )}
          {isError && (
            <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <p className="text-xs text-slate-400">ไม่สามารถโหลดแผนที่ได้</p>
            </div>
          )}

          {/* Longdo Map Container */}
          <div ref={mapContainerRef} className="h-full w-full z-0 bg-slate-900" />

          {/* Legend Overlay */}
          <div className="absolute bottom-3 left-3 z-10 bg-slate-950/85 backdrop-blur-md border border-white/15 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] text-white shadow-xl space-y-1.5">
            <div className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-wider">Legend</div>
            {[
              { color: "bg-emerald-500 shadow-emerald-500/50", label: "ปกติ (กำลังพลครบ)" },
              { color: "bg-amber-500 shadow-amber-500/50", label: `เฝ้าระวัง (${filteredSites.filter((s) => s.status === "WARNING").length})` },
              { color: "bg-rose-500 shadow-rose-500/50", label: `แจ้งเตือน Geofence (${filteredSites.filter((s) => s.status === "ALERT").length})` },
              { color: "bg-brand-600 shadow-brand-500/50", label: "สำนักงานใหญ่" },
            ].map((item) => (
              <div key={item.label} className="flex items-center space-x-2">
                <span className={`w-2.5 h-2.5 rounded-full shadow-sm flex-shrink-0 ${item.color}`} />
                <span className="truncate">{item.label}</span>
              </div>
            ))}
            <div className="pt-1 text-[9px] text-slate-400 border-t border-white/10 hidden sm:block">
              * วงกลมประรอบแสดงรัศมี Geofence (200 - 300 ม.)
            </div>
          </div>
        </div>

        {/* ===== Live Site Radar Sidebar ===== */}
        {showRadarList && (
          <div className="w-full lg:w-72 xl:w-80 bg-surface-card border-t lg:border-t-0 lg:border-l border-surface-border flex flex-col h-48 lg:h-full z-10">
            <div className="p-3 border-b border-surface-border bg-surface-subtle/50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-bold text-xs text-content-primary">
                  เรดาร์จุดปฏิบัติงาน ({filteredSites.length})
                </h3>
              </div>
              <span className="text-[10px] text-content-muted font-bold">
                เข้างาน {filteredSites.reduce((a, b) => a + b.actualOnDuty, 0)} คน
              </span>
            </div>

            {/* Site List */}
            <div className="flex-1 overflow-y-auto divide-y divide-surface-border">
              {filteredSites.map((site) => {
                const isSelected = activeSite?.id === site.id;
                return (
                  <div
                    key={site.id}
                    onClick={() => handleFlyToSite(site)}
                    className={`p-3 cursor-pointer transition-all hover:bg-surface-subtle flex items-start justify-between gap-2 ${
                      isSelected ? "bg-brand-50 dark:bg-brand-950/40 border-l-4 border-brand-600" : ""
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-xs text-content-primary truncate">{site.code}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex-shrink-0 ${
                            site.status === "ALERT"
                              ? "bg-rose-500/10 text-rose-600"
                              : site.status === "WARNING"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}
                        >
                          {site.status === "ALERT" ? "เตือน" : site.status === "WARNING" ? "ขาดคน" : "ปกติ"}
                        </span>
                      </div>
                      <div className="text-[11px] text-content-secondary font-medium truncate">{site.name}</div>
                      <div className="text-[10px] text-content-muted flex items-center gap-1.5">
                        <span className="truncate">{site.estateName}</span>
                        <span className="flex-shrink-0">• {site.radius}m</span>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0">
                      <div className="text-xs font-black text-content-primary">
                        {site.actualOnDuty}/{site.targetHeadcount}
                      </div>
                      <span className="text-[10px] text-content-muted font-bold">{site.attendanceRate}%</span>
                      {site.reliefCount > 0 && (
                        <span className="mt-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[9px] font-bold">
                          +{site.reliefCount} เสริม
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== Selected Site Spotlight Drawer ===== */}
      {activeSite && (
        <div className="p-3 sm:p-4 bg-surface-subtle/80 border-t border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-brand-600 text-white shadow-md flex-shrink-0">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded-md bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-black flex-shrink-0">
                  {activeSite.code}
                </span>
                <h4 className="font-black text-sm text-content-primary truncate">{activeSite.name}</h4>
              </div>
              <p className="text-xs text-content-muted mt-0.5 truncate">
                {activeSite.location} • {activeSite.estateName}
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1.5 text-xs text-content-secondary">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>{activeSite.workHours}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  <span>
                    <strong>{activeSite.actualOnDuty}</strong> / {activeSite.targetHeadcount} คน ({activeSite.attendanceRate}%)
                  </span>
                </span>
                <span className="flex items-center space-x-1 hidden sm:flex">
                  <Phone className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>{activeSite.contactName} ({activeSite.contactPhone})</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${activeSite.lat},${activeSite.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border hover:bg-surface-subtle text-xs font-bold text-content-primary transition-all"
            >
              <span className="hidden sm:inline">Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              id="map-close-site-drawer-btn"
              onClick={() => setActiveSite(null)}
              className="px-3 py-1.5 rounded-xl bg-surface-card hover:bg-surface-subtle border border-surface-border text-xs font-bold text-content-muted transition-all"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
