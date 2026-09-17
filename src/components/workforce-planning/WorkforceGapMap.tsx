"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  MapPin,
  Search,
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  EyeOff,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteStaffingSummary } from "@/server/services/workforce-planning.service";

import "leaflet/dist/leaflet.css";

interface WorkforceGapMapProps {
  sites: SiteStaffingSummary[];
  selectedSite: SiteStaffingSummary | null;
  onSelectSite: (site: SiteStaffingSummary) => void;
  className?: string;
}

export function WorkforceGapMap({
  sites,
  selectedSite,
  onSelectSite,
  className,
}: WorkforceGapMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const linesLayerRef = useRef<any>(null);

  const [showConnectionLines, setShowConnectionLines] = useState(true);
  const [filterShortageOnly, setFilterShortageOnly] = useState(false);
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

  const displayedSites = useMemo(() => {
    if (!filterShortageOnly) return validSites;
    return validSites.filter(
      (s) => s.status === "CRITICAL_SHORTAGE" || s.status === "UNDERSTAFFED"
    );
  }, [validSites, filterShortageOnly]);

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

  // 1. Initialize Map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return;

    let L: any;
    let isCancelled = false;

    import("leaflet").then((leafletModule) => {
      if (isCancelled) return;
      L = leafletModule.default || leafletModule;

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [12.6841, 101.1476],
          zoom: 11,
          zoomControl: false,
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: "bottomright" }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        linesLayerRef.current = L.layerGroup().addTo(map);

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

  // 2. Render Markers and Connection Lines
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;

    import("leaflet").then((leafletModule) => {
      const L = leafletModule.default || leafletModule;
      const map = mapInstanceRef.current;
      const markersLayer = markersLayerRef.current;
      const linesLayer = linesLayerRef.current;

      markersLayer.clearLayers();
      linesLayer.clearLayers();

      const bounds: any[] = [];

      displayedSites.forEach((site) => {
        const lat = site.lat!;
        const lng = site.lng!;
        bounds.push([lat, lng]);

        let badgeBg = "bg-emerald-600";
        let borderClass = "border-emerald-400";
        let gapText = `0 (พอดี)`;

        if (site.status === "CRITICAL_SHORTAGE") {
          badgeBg = "bg-rose-600 animate-pulse";
          borderClass = "border-rose-400 ring-2 ring-rose-500/50";
          gapText = `ขาด ${site.deficit} คน`;
        } else if (site.status === "UNDERSTAFFED") {
          badgeBg = "bg-amber-600";
          borderClass = "border-amber-400";
          gapText = `ขาด ${site.deficit} คน`;
        } else if (site.status === "OVERSTAFFED") {
          badgeBg = "bg-cyan-600";
          borderClass = "border-cyan-400";
          gapText = `เกิน +${site.surplus} คน`;
        }

        const isSelected = selectedSite?.id === site.id;

        // Custom HTML Marker Icon
        const iconHtml = `
          <div class="relative group cursor-pointer flex flex-col items-center">
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white font-black text-[11px] shadow-xl border-2 ${borderClass} ${badgeBg} transition-transform duration-200 ${
          isSelected ? "scale-125 ring-4 ring-brand-500/70" : "hover:scale-110"
        }">
              <span>${site.working}/${site.target}</span>
              <span class="text-[9px] font-mono bg-black/30 px-1 py-0.5 rounded font-bold">${gapText}</span>
            </div>

            <div class="mt-1 px-2 py-0.5 rounded-md bg-slate-950/95 text-white text-[10px] font-bold border border-slate-700 shadow-md whitespace-nowrap max-w-[130px] truncate text-center">
              ${site.name}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-workforce-marker",
          iconSize: [130, 50],
          iconAnchor: [65, 25],
        });

        const marker = L.marker([lat, lng], { icon: customIcon });

        marker.bindTooltip(
          `
          <div class="p-2 space-y-1 font-sans text-slate-900">
            <div class="font-bold text-xs">${site.name} (${site.code})</div>
            <div class="text-[11px] text-slate-700">กำลังคน: <strong>${site.working}</strong> / เป้าหมาย: <strong>${site.target}</strong> (ขั้นต่ำ: ${site.minimum})</div>
            <div class="text-[11px] font-bold ${
              site.status === "CRITICAL_SHORTAGE"
                ? "text-rose-600"
                : site.status === "UNDERSTAFFED"
                ? "text-amber-600"
                : site.status === "OVERSTAFFED"
                ? "text-cyan-700"
                : "text-emerald-600"
            }">
              สถานะ: ${site.status} (${gapText})
            </div>
            ${
              site.requiresSupervisor && !site.supervisorPresent
                ? '<div class="text-[10px] text-rose-600 font-bold">⚠️ ไม่มี Supervisor ประจำการ</div>'
                : ""
            }
          </div>
          `,
          { direction: "top", offset: [0, -20] }
        );

        marker.on("click", () => {
          onSelectSite(site);
          map.flyTo([lat, lng], 13.5, { duration: 0.8 });
        });

        markersLayer.addLayer(marker);
      });

      // 3. Render connection lines from selected site if understaffed to nearby surplus sites
      if (
        showConnectionLines &&
        selectedSite &&
        selectedSite.lat &&
        selectedSite.lng &&
        (selectedSite.status === "CRITICAL_SHORTAGE" || selectedSite.status === "UNDERSTAFFED")
      ) {
        selectedSite.nearbySurplusSites.forEach((surplusSite) => {
          const latLngs: [number, number][] = [
            [selectedSite.lat!, selectedSite.lng!],
            [surplusSite.lat, surplusSite.lng],
          ];

          const line = L.polyline(latLngs as any, {
            color: "#06b6d4", // Cyan
            weight: 3,
            opacity: 0.85,
            dashArray: "6, 8",
          });

          line.bindTooltip(
            `
            <div class="text-[11px] font-sans p-1">
              <strong>${surplusSite.siteName}</strong> (+${surplusSite.surplus} คน)<br />
              ระยะทาง: <strong>${surplusSite.distanceKm} กม.</strong>
            </div>
            `,
            { sticky: true }
          );

          linesLayer.addLayer(line);
        });
      }

      if (bounds.length > 0 && !selectedSite) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }
    });
  }, [displayedSites, showConnectionLines, selectedSite, mapLoaded, onSelectSite]);

  const handleFitAll = () => {
    if (!mapInstanceRef.current || validSites.length === 0) return;
    const bounds = validSites.map((s) => [s.lat!, s.lng!]);
    mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  };

  const handleSelectSiteFromSearch = (site: SiteStaffingSummary) => {
    setSearchQuery("");
    setSearchOpen(false);
    onSelectSite(site);
    if (mapInstanceRef.current && site.lat && site.lng) {
      mapInstanceRef.current.flyTo([site.lat, site.lng], 14, { duration: 1 });
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 flex flex-col",
        isFullscreen ? "fixed inset-0 z-50 rounded-none h-screen" : "h-[480px] md:h-[580px]",
        className
      )}
    >
      {/* Top Map Control Bar */}
      <div className="absolute top-4 inset-x-4 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search Input */}
        <div className="relative pointer-events-auto w-64 sm:w-80">
          <div className="flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-2 shadow-xl">
            <Search className="w-4 h-4 text-brand-400 shrink-0 mr-2" />
            <input
              type="text"
              placeholder="ค้นหาไซต์ในแผนผังกำลังคน..."
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
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded",
                      s.deficit > 0 ? "bg-rose-900/60 text-rose-300" : "bg-cyan-900/60 text-cyan-300"
                    )}
                  >
                    {s.deficit > 0 ? `ขาด ${s.deficit}` : `เกิน +${s.surplus}`}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 p-1.5 rounded-2xl shadow-xl">
          <button
            onClick={handleFitAll}
            title="แสดงทุกไซต์ (Fit all)"
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">รวมทุกไซต์</span>
          </button>

          {/* Toggle Connection Lines */}
          <button
            onClick={() => setShowConnectionLines(!showConnectionLines)}
            title="เปิด/ปิดเส้นเชื่อมโยงไซต์สำรอง (Surplus Routes)"
            className={cn(
              "p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold",
              showConnectionLines
                ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <Route className="w-4 h-4" />
            <span className="hidden sm:inline">เส้นเชื่อมโยง</span>
          </button>

          {/* Filter Shortage Only */}
          <button
            onClick={() => setFilterShortageOnly(!filterShortageOnly)}
            title="กรองเฉพาะไซต์ที่กำลังคนขาด (Understaffed)"
            className={cn(
              "p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold",
              filterShortageOnly
                ? "bg-rose-500/30 text-rose-300 border border-rose-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <TrendingDown className="w-4 h-4" />
            <span className="hidden sm:inline">เฉพาะที่ขาดคน</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "ออกจากโหมดเต็มจอ" : "เต็มจอ"}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Selected Site Shortage Route Callout Banner */}
      {selectedSite && selectedSite.deficit > 0 && selectedSite.nearbySurplusSites.length > 0 && (
        <div className="absolute bottom-4 left-4 right-16 z-[400] bg-cyan-950/90 border border-cyan-500/50 backdrop-blur-md rounded-2xl px-4 py-2.5 text-cyan-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xl">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>{selectedSite.name}</strong> ขาดคน <strong>{selectedSite.deficit} คน</strong> — พบไซต์ใกล้เคียงที่มีคนเกิน{" "}
              <strong>{selectedSite.nearbySurplusSites.length} แห่ง</strong> (ที่ใกล้ที่สุด:{" "}
              {selectedSite.nearbySurplusSites[0].siteName} ห่าง {selectedSite.nearbySurplusSites[0].distanceKm} กม.)
            </span>
          </div>
          <span className="text-[10px] font-mono bg-cyan-900/80 px-2 py-0.5 rounded text-cyan-300">
            คลิกดูพนักงานที่แนะนำด้านขวา →
          </span>
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
