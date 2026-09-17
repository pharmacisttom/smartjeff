"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  MapPin,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  Filter,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteSummaryData } from "@/server/services/executive-operations.service";

import "leaflet/dist/leaflet.css";

interface ExecutiveLiveMapProps {
  sites: SiteSummaryData[];
  selectedSite: SiteSummaryData | null;
  onSelectSite: (site: SiteSummaryData) => void;
  className?: string;
}

export function ExecutiveLiveMap({
  sites,
  selectedSite,
  onSelectSite,
  className,
}: ExecutiveLiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const circlesLayerRef = useRef<any>(null);

  const [showGeofence, setShowGeofence] = useState(true);
  const [filterAlertsOnly, setFilterAlertsOnly] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter sites with valid coordinates
  const validSites = useMemo(() => {
    return sites.filter(
      (s) => typeof s.lat === "number" && typeof s.lng === "number" && !isNaN(s.lat) && !isNaN(s.lng)
    );
  }, [sites]);

  const unmappedSites = useMemo(() => {
    return sites.filter(
      (s) => typeof s.lat !== "number" || typeof s.lng !== "number" || isNaN(s.lat) || isNaN(s.lng)
    );
  }, [sites]);

  // Filtered by alert toggle
  const displayedSites = useMemo(() => {
    if (!filterAlertsOnly) return validSites;
    return validSites.filter((s) => s.flags.alert || s.status === "ALERT" || s.status === "LOW_STAFF" || s.status === "EMPTY");
  }, [validSites, filterAlertsOnly]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return validSites
      .filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.location && s.location.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .slice(0, 5);
  }, [validSites, searchQuery]);

  // 1. Initialize Leaflet Map Instance
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;
    let isCancelled = false;

    import("leaflet").then((leafletModule) => {
      if (isCancelled) return;
      L = leafletModule.default || leafletModule;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        // Default center: Rayong Industrial Region (12.6841, 101.1476)
        const map = L.map(mapContainerRef.current, {
          center: [12.6841, 101.1476],
          zoom: 11,
          zoomControl: false,
        });

        // Dark Matter / Stadia / OpenStreetMap Tile Layer
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);

        // Zoom control on bottom-right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        circlesLayerRef.current = L.layerGroup().addTo(map);

        mapInstanceRef.current = map;
        setMapLoaded(true);
      }
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Render Markers and Geofences
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      const circlesLayer = circlesLayerRef.current;

      markersLayer.clearLayers();
      circlesLayer.clearLayers();

      const bounds: any[] = [];

      displayedSites.forEach((site) => {
        const lat = site.lat!;
        const lng = site.lng!;
        bounds.push([lat, lng]);

        // Status Colors
        let statusColor = "#10b981"; // Emerald / Active
        let pulseClass = "";
        let borderClass = "border-emerald-400";
        let bgBadge = "bg-emerald-600";

        if (site.status === "ALERT" || site.flags.alert) {
          statusColor = "#ef4444";
          pulseClass = "animate-ping";
          borderClass = "border-rose-400";
          bgBadge = "bg-rose-600";
        } else if (site.status === "EMPTY") {
          statusColor = "#f43f5e";
          borderClass = "border-rose-500";
          bgBadge = "bg-rose-500";
        } else if (site.status === "LOW_STAFF") {
          statusColor = "#f59e0b";
          borderClass = "border-amber-400";
          bgBadge = "bg-amber-500";
        } else if (site.status === "OT_ACTIVE") {
          statusColor = "#06b6d4";
          borderClass = "border-cyan-400";
          bgBadge = "bg-cyan-600";
        }

        const isSelected = selectedSite?.id === site.id;

        // Geofence Circle
        if (showGeofence && site.radius > 0) {
          const circle = L.circle([lat, lng], {
            radius: site.radius,
            color: statusColor,
            weight: isSelected ? 2.5 : 1.5,
            opacity: 0.8,
            fillColor: statusColor,
            fillOpacity: isSelected ? 0.25 : 0.12,
            dashArray: site.status === "EMPTY" ? "4, 6" : undefined,
          });
          circlesLayer.addLayer(circle);
        }

        // Custom HTML Marker Icon
        const iconHtml = `
          <div class="relative group cursor-pointer flex flex-col items-center">
            ${
              site.flags.alert
                ? `<span class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full ${pulseClass} opacity-75"></span>`
                : ""
            }
            <div class="flex items-center gap-1 px-2.5 py-1 rounded-full text-white font-black text-[11px] shadow-lg border-2 ${borderClass} ${bgBadge} transition-transform duration-200 ${
          isSelected ? "scale-125 ring-4 ring-brand-500/50" : "hover:scale-110"
        }">
              <span class="text-xs">👤</span>
              <span>${site.working}/${site.assignedEmployees}</span>
            </div>

            <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-950/90 text-white text-[10px] font-bold border border-slate-700 shadow-md whitespace-nowrap max-w-[130px] truncate text-center">
              ${site.name}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-site-marker",
          iconSize: [120, 50],
          iconAnchor: [60, 25],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        // Tooltip
        marker.bindTooltip(
          `
          <div class="p-1.5 space-y-1 text-slate-900 font-sans">
            <div class="font-bold text-xs flex items-center gap-1">
              <span>${site.name}</span>
              <span class="text-[10px] text-slate-500 font-mono">(${site.code})</span>
            </div>
            <div class="text-[11px] text-slate-600">
              สถานะ: <strong class="text-slate-900">${site.status}</strong> | Util: <strong>${site.utilization}%</strong>
            </div>
            <div class="text-[10px] text-slate-500">
              กำลังทำงาน: <strong>${site.working}</strong> / ประจำ: <strong>${site.assignedEmployees}</strong> คน
            </div>
          </div>
          `,
          { direction: "top", offset: [0, -20] }
        );

        marker.on("click", () => {
          onSelectSite(site);
          map.flyTo([lat, lng], 14, { duration: 0.8 });
        });

        markersLayer.addLayer(marker);
      });

      // Fit bounds if available and no specific site selected
      if (bounds.length > 0 && !selectedSite) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    });
  }, [displayedSites, showGeofence, selectedSite, mapLoaded, onSelectSite]);

  // Fit bounds helper
  const handleFitAll = () => {
    if (!mapInstanceRef.current || validSites.length === 0) return;
    const bounds = validSites.map((s) => [s.lat!, s.lng!]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  };

  // Fly to selected site
  const handleSelectSiteFromSearch = (site: SiteSummaryData) => {
    setSearchQuery("");
    setSearchOpen(false);
    onSelectSite(site);
    if (mapInstanceRef.current && site.lat && site.lng) {
      mapInstanceRef.current.flyTo([site.lat, site.lng], 15, { duration: 1 });
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col",
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : "h-[460px] md:h-[580px]",
        className
      )}
    >
      {/* Top Map Control Bar */}
      <div className="absolute top-4 inset-x-4 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search Input Autocomplete */}
        <div className="relative pointer-events-auto w-64 sm:w-80">
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2 shadow-xl">
            <Search className="w-4 h-4 text-brand-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="ค้นหาไซต์บนแผนที่..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full"
            />
          </div>

          {searchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-800">
              {searchResults.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSiteFromSearch(s)}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-slate-800/80 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-white truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{s.location || s.code}</div>
                  </div>
                  <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-brand-300">
                    {s.working}/{s.assignedEmployees} คน
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Map Controls Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl">
          {/* Fit Bounds */}
          <button
            onClick={handleFitAll}
            title="แสดงทุกไซต์ (Fit all sites)"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">รวมทุกไซต์</span>
          </button>

          {/* Toggle Geofence */}
          <button
            onClick={() => setShowGeofence(!showGeofence)}
            title="เปิด/ปิดรัศมี Geofence"
            className={cn(
              "p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold",
              showGeofence
                ? "bg-brand-600/30 text-brand-300 border border-brand-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            {showGeofence ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden sm:inline">Geofence</span>
          </button>

          {/* Filter Alerts Only */}
          <button
            onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
            title="กรองเฉพาะไซต์ที่มีปัญหา/Alert"
            className={cn(
              "p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold",
              filterAlertsOnly
                ? "bg-rose-500/30 text-rose-300 border border-rose-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Alerts Only</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "ออกจากโหมดเต็มจอ" : "เต็มจอ"}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Unmapped Sites Warning Banner */}
      {unmappedSites.length > 0 && (
        <div className="absolute bottom-4 left-4 right-16 z-[400] bg-amber-950/80 border border-amber-500/40 backdrop-blur-md rounded-2xl px-3.5 py-2 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2 truncate">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              มี <strong>{unmappedSites.length} ไซต์</strong> ยังไม่ได้กำหนดพิกัด GPS (ไม่สามารถปักหมุดบนแผนที่ได้)
            </span>
          </div>
          <a
            href="/admin/sites"
            className="shrink-0 underline font-bold hover:text-white transition-colors text-[11px]"
          >
            ตั้งค่าพิกัดไซต์ →
          </a>
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
