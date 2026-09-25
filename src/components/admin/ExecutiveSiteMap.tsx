"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Shield,
  Users,
  Clock,
  Phone,
  Mail,
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
  onSelectSite?: (site: SiteOperationalData) => void;
  selectedSiteId?: string | null;
}

export function ExecutiveSiteMap({
  sites,
  onSelectSite,
  selectedSiteId,
}: ExecutiveSiteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const circlesLayerRef = useRef<any>(null);

  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);
  const [activeSite, setActiveSite] = useState<SiteOperationalData | null>(null);
  const [mapStyle, setMapStyle] = useState<"voyager" | "dark" | "satellite">("voyager");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEstate, setSelectedEstate] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRadarList, setShowRadarList] = useState(true);

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

  // Dynamic Leaflet Loader
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    // Add Leaflet CSS
    const linkId = "leaflet-css-bundle";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    // Add Leaflet JS
    const scriptId = "leaflet-js-bundle";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.crossOrigin = "";
      script.async = true;
      script.onload = () => {
        setIsLeafletLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if ((window as any).L) {
          setIsLeafletLoaded(true);
          clearInterval(checkInterval);
        }
      }, 100);
      return () => clearInterval(checkInterval);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      // Center on Rayong / Chonburi industrial corridor (13.01, 101.15)
      const map = L.map(mapContainerRef.current, {
        center: [13.0039, 101.1668],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Tile layers
      const tileUrl =
        mapStyle === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : mapStyle === "satellite"
          ? "https://server.arcgisonline.com/ArcExp/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      const baseLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      (map as any)._baseLayer = baseLayer;

      markersLayerRef.current = L.layerGroup().addTo(map);
      circlesLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    } else {
      // Update tile layer if style changed
      const map = mapInstanceRef.current;
      if ((map as any)._baseLayer) {
        map.removeLayer((map as any)._baseLayer);
      }
      const tileUrl =
        mapStyle === "dark"
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : mapStyle === "satellite"
          ? "https://server.arcgisonline.com/ArcExp/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

      (map as any)._baseLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);
    }
  }, [isLeafletLoaded, mapStyle]);

  // Render Markers and Geofences
  useEffect(() => {
    if (!mapInstanceRef.current || !isLeafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    const markersGroup = markersLayerRef.current;
    const circlesGroup = circlesLayerRef.current;

    if (markersGroup) markersGroup.clearLayers();
    if (circlesGroup) circlesGroup.clearLayers();

    if (!filteredSites || filteredSites.length === 0) return;

    const bounds = L.latLngBounds([]);

    filteredSites.forEach((site) => {
      if (!site.lat || !site.lng) return;

      const latLng = [site.lat, site.lng];
      bounds.extend(latLng);

      const isHQ = site.code.includes("HQ");
      const isSelected = activeSite?.id === site.id || selectedSiteId === site.id;

      // Status Colors
      let colorClass = "bg-emerald-500 border-emerald-300 text-white shadow-emerald-500/50";
      let ringColor = "rgba(16, 185, 129, 0.4)";
      let circleFill = "#10b981";

      if (isHQ) {
        colorClass = "bg-brand-600 border-brand-300 text-white shadow-brand-500/50";
        ringColor = "rgba(59, 130, 246, 0.4)";
        circleFill = "#3b82f6";
      } else if (site.status === "ALERT" || site.outsideGeofenceCount > 0) {
        colorClass = "bg-rose-500 border-rose-300 text-white shadow-rose-500/50";
        ringColor = "rgba(244, 63, 94, 0.4)";
        circleFill = "#f43f5e";
      } else if (site.status === "WARNING" || site.actualOnDuty < site.targetHeadcount) {
        colorClass = "bg-amber-500 border-amber-300 text-white shadow-amber-500/50";
        ringColor = "rgba(245, 158, 11, 0.4)";
        circleFill = "#f59e0b";
      }

      // Geofence Circle
      const circle = L.circle(latLng, {
        radius: site.radius || 200,
        color: circleFill,
        weight: isSelected ? 2.5 : 1.2,
        dashArray: isSelected ? undefined : "4, 6",
        fillColor: circleFill,
        fillOpacity: isSelected ? 0.18 : 0.08,
      });
      circlesGroup.addLayer(circle);

      // Custom HTML Marker Icon
      const customIcon = L.divIcon({
        className: "custom-site-pin",
        html: `
          <div class="relative group cursor-pointer flex flex-col items-center">
            ${
              site.outsideGeofenceCount > 0
                ? `<div class="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white animate-ping">!</div>`
                : ""
            }
            <div class="relative w-8 h-8 rounded-2xl flex items-center justify-center font-black text-[10px] shadow-lg border-2 transition-all transform hover:scale-125 ${
              isSelected ? "scale-125 ring-4 ring-white" : ""
            } ${colorClass}">
              ${site.code.substring(0, 3)}
            </div>
            <div class="mt-1 px-1.5 py-0.5 rounded-md bg-slate-950/90 text-white text-[9px] font-bold whitespace-nowrap shadow-md border border-white/10 pointer-events-none opacity-90">
              ${site.code} • ${site.actualOnDuty}/${site.targetHeadcount}
            </div>
          </div>
        `,
        iconSize: [44, 48],
        iconAnchor: [22, 24],
        popupAnchor: [0, -26],
      });

      const marker = L.marker(latLng, { icon: customIcon });

      // Rich HTML Popup
      const popupContent = `
        <div style="font-family: inherit; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: #1e293b;">${site.code}</span>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: ${
              site.status === "ALERT" ? "#fee2e2; color: #b91c1c;" : site.status === "WARNING" ? "#fef3c7; color: #b45309;" : "#dcfce7; color: #15803d;"
            }">${site.status === "ALERT" ? "แจ้งเตือน" : site.status === "WARNING" ? "เฝ้าระวัง" : "ปกติ"}</span>
          </div>
          <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 4px; line-height: 1.3;">${site.name}</div>
          <div style="font-size: 10px; color: #64748b; margin-bottom: 8px;">${site.estateName || site.location}</div>
          <div style="background: #f8fafc; border-radius: 8px; padding: 6px 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 11px; margin-bottom: 8px;">
            <div>
              <span style="font-size: 9px; color: #94a3b8; display: block;">กำลังพลปฏิบัติงาน</span>
              <strong style="color: #0f172a;">${site.actualOnDuty} / ${site.targetHeadcount} คน</strong>
            </div>
            <div>
              <span style="font-size: 9px; color: #94a3b8; display: block;">Geofence รัศมี</span>
              <strong style="color: #0f172a;">${site.radius} เมตร</strong>
            </div>
          </div>
          <div style="font-size: 10px; color: #475569; display: flex; align-items: center; gap: 4px; margin-bottom: 2px;">
            <span>⏱️ กะ: ${site.workHours}</span>
          </div>
          <div style="font-size: 10px; color: #475569; display: flex; align-items: center; gap: 4px;">
            <span>📞 ผู้ดูแล: ${site.contactName} (${site.contactPhone})</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { closeButton: false, offset: [0, -10] });

      marker.on("click", () => {
        setActiveSite(site);
        if (onSelectSite) onSelectSite(site);
      });

      markersGroup.addLayer(marker);
    });

    // Auto-fit bounds if we have multiple sites and no single site focused
    if (!selectedSiteId && filteredSites.length > 1 && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [filteredSites, isLeafletLoaded, activeSite, selectedSiteId]);

  // Handle external selected site pan/zoom
  useEffect(() => {
    if (!selectedSiteId || !mapInstanceRef.current || !sites) return;
    const site = sites.find((s) => s.id === selectedSiteId);
    if (site && site.lat && site.lng) {
      setActiveSite(site);
      mapInstanceRef.current.flyTo([site.lat, site.lng], 15, { duration: 1.2 });
    }
  }, [selectedSiteId, sites]);

  const handleFlyToSite = (site: SiteOperationalData) => {
    setActiveSite(site);
    if (onSelectSite) onSelectSite(site);
    if (mapInstanceRef.current && site.lat && site.lng) {
      mapInstanceRef.current.flyTo([site.lat, site.lng], 15, { duration: 1.2 });
    }
  };

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([13.0039, 101.1668], 11, { duration: 1 });
    }
  };

  return (
    <div
      className={`relative bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-xl transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 rounded-2xl shadow-2xl" : "w-full"
      }`}
    >
      {/* Top Map Control Bar */}
      <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black tracking-tight">
                ศูนย์บัญชาการแผนที่ปฏิบัติงานภาคสนาม (GIS Operations Command)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ติดตามจุดทำงาน {sites.length} จุดในนิคมฯ ระยอง-ชลบุรี พร้อมระบบตรวจจับ Geofence และกำลังพลเรียลไทม์
            </p>
          </div>
        </div>

        {/* Quick Filter & Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาไซต์ / นิคมฯ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-white/10 text-white placeholder-slate-400 border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs w-44"
            />
          </div>

          {/* Estate Filter */}
          <select
            value={selectedEstate}
            onChange={(e) => setSelectedEstate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">
              นิคมฯ ทั้งหมด ({sites.length})
            </option>
            {estates
              .filter((e) => e !== "ALL")
              .map((est) => (
                <option key={est} value={est} className="bg-slate-900 text-white">
                  {est}
                </option>
              ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10 font-bold text-[11px]">
            <button
              onClick={() => setSelectedStatus("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedStatus === "ALL" ? "bg-white text-slate-950 shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setSelectedStatus("NORMAL")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                selectedStatus === "NORMAL" ? "bg-emerald-500 text-white shadow" : "text-emerald-300 hover:text-white"
              }`}
            >
              <span>ปกติ</span>
            </button>
            <button
              onClick={() => setSelectedStatus("ALERT")}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 ${
                selectedStatus === "ALERT" ? "bg-rose-500 text-white shadow" : "text-rose-300 hover:text-white"
              }`}
            >
              <span>แจ้งเตือน</span>
            </button>
          </div>

          {/* Map Layer Mode */}
          <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10 text-[11px] font-bold">
            <button
              onClick={() => setMapStyle("voyager")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapStyle === "voyager" ? "bg-brand-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              แผนที่
            </button>
            <button
              onClick={() => setMapStyle("dark")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapStyle === "dark" ? "bg-brand-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              โหมดมืด
            </button>
            <button
              onClick={() => setMapStyle("satellite")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                mapStyle === "satellite" ? "bg-brand-600 text-white shadow" : "text-slate-300 hover:text-white"
              }`}
            >
              ดาวเทียม
            </button>
          </div>

          {/* Action Tools */}
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title="รีเซ็ตมุมมองศูนย์กลาง"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowRadarList(!showRadarList)}
            className={`p-2 rounded-xl border transition-all ${
              showRadarList ? "bg-white text-slate-900 border-white" : "bg-white/10 text-white border-white/10"
            }`}
            title="เปิด/ปิด แผงเรดาร์ไซต์งาน"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
            title={isFullscreen ? "ย่อหน้าต่าง" : "ขยายเต็มจอ"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Map Body + Side Radar Panel */}
      <div className="relative flex flex-col lg:flex-row h-[520px]">
        {/* Leaflet Canvas Container */}
        <div className="relative flex-1 h-full w-full">
          <div ref={mapContainerRef} className="h-full w-full z-0 bg-slate-900" />

          {/* Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-slate-950/85 backdrop-blur-md border border-white/15 p-3 rounded-2xl text-[11px] text-white shadow-xl space-y-1.5 pointer-events-auto">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              สัญลักษณ์จุดทำงาน (Legend)
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
              <span>ปกติ (กำลังพลครบตามเป้า)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
              <span>เฝ้าระวัง / ขอกำลังเสริม ({filteredSites.filter((s) => s.status === "WARNING").length})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
              <span>แจ้งเตือนนอกพื้นที่ Geofence ({filteredSites.filter((s) => s.status === "ALERT").length})</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-brand-600 shadow-sm shadow-brand-500/50" />
              <span>สำนักงานใหญ่ / ศูนย์กลางบัญชาการ</span>
            </div>
            <div className="pt-1 text-[9px] text-slate-400 border-t border-white/10">
              * วงกลมประรอบจุดแสดงรัศมีตรวจจับ Geofence (200 - 300 ม.)
            </div>
          </div>
        </div>

        {/* Live Site Radar Sidebar */}
        {showRadarList && (
          <div className="w-full lg:w-80 bg-surface-card border-t lg:border-t-0 lg:border-l border-surface-border flex flex-col h-full z-10">
            <div className="p-3.5 border-b border-surface-border bg-surface-subtle/50 flex items-center justify-between">
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
                    className={`p-3.5 cursor-pointer transition-all hover:bg-surface-subtle flex items-start justify-between gap-2 ${
                      isSelected ? "bg-brand-50 dark:bg-brand-950/40 border-l-4 border-brand-600" : ""
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-xs text-content-primary truncate">{site.code}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            site.status === "ALERT"
                              ? "bg-rose-500/10 text-rose-600"
                              : site.status === "WARNING"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-emerald-500/10 text-emerald-600"
                          }`}
                        >
                          {site.status === "ALERT" ? "เตือน Geofence" : site.status === "WARNING" ? "ขาดคน" : "ปกติ"}
                        </span>
                      </div>
                      <div className="text-[11px] text-content-secondary font-medium truncate">{site.name}</div>
                      <div className="text-[10px] text-content-muted flex items-center space-x-2">
                        <span>{site.estateName}</span>
                        <span>•</span>
                        <span>รัศมี {site.radius}m</span>
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

      {/* Selected Site Spotlight Drawer */}
      {activeSite && (
        <div className="p-4 bg-surface-subtle/80 border-t border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 rounded-2xl bg-brand-600 text-white shadow-md">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs font-black">
                  {activeSite.code}
                </span>
                <h4 className="font-black text-sm text-content-primary">{activeSite.name}</h4>
              </div>
              <p className="text-xs text-content-muted mt-0.5">
                {activeSite.location} • นิคมฯ: {activeSite.estateName}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-content-secondary">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>เวลาเข้างาน: {activeSite.workHours}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-purple-500" />
                  <span>
                    กำลังพล: <strong>{activeSite.actualOnDuty}</strong> / {activeSite.targetHeadcount} คน (
                    {activeSite.attendanceRate}%)
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    ผู้ประสานงาน: {activeSite.contactName} ({activeSite.contactPhone})
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${activeSite.lat},${activeSite.lng}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-surface-card border border-surface-border hover:bg-surface-subtle text-xs font-bold text-content-primary transition-all"
            >
              <span>เปิดใน Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setActiveSite(null)}
              className="px-3 py-2 rounded-xl bg-surface-card hover:bg-surface-subtle border border-surface-border text-xs font-bold text-content-muted"
            >
              ปิดแถบนี้
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
