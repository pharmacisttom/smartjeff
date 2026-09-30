"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Navigation,
  Layers,
  Search,
  Maximize2,
  Minimize2,
  AlertTriangle,
  Locate,
  ShieldCheck,
  Compass,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLongdoMap } from "@/hooks/useLongdoMap";

export interface SmartMapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  status?: "NORMAL" | "WARNING" | "ALERT" | "ACTIVE" | "OFFLINE" | string;
  category?: "EMPLOYEE" | "SITE" | "VEHICLE" | "INCIDENT" | "WORK_ORDER" | "CLIENT";
  color?: string;
  badge?: string;
  detailHtml?: string;
  onClick?: () => void;
}

export interface SmartMapCircle {
  id: string;
  lat: number;
  lng: number;
  radius: number; // meters
  color?: string;
  title?: string;
}

export interface SmartMapPolygon {
  id: string;
  points: { lat: number; lng: number }[];
  color?: string;
  title?: string;
}

export interface SmartMapPolyline {
  id: string;
  points: { lat: number; lng: number }[];
  color?: string;
  width?: number;
}

export interface SmartLongdoMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  markers?: SmartMapMarker[];
  circles?: SmartMapCircle[];
  polygons?: SmartMapPolygon[];
  polylines?: SmartMapPolyline[];
  clusterThreshold?: number; // Enable clustering if markers > threshold
  showSearch?: boolean;
  showTrafficToggle?: boolean;
  showLayerToggle?: boolean;
  showLocateMe?: boolean;
  showFullscreen?: boolean;
  enable3D?: boolean;
  onMarkerSelect?: (marker: SmartMapMarker) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  className?: string;
}

export function SmartLongdoMap({
  center = { lat: 13.0039, lng: 101.1668 },
  zoom = 11,
  height = "h-96",
  markers = [],
  circles = [],
  polygons = [],
  polylines = [],
  clusterThreshold = 25,
  showSearch = true,
  showTrafficToggle = true,
  showLayerToggle = true,
  showLocateMe = true,
  showFullscreen = true,
  enable3D = false,
  onMarkerSelect,
  onMapClick,
  className,
}: SmartLongdoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  const [layerMode, setLayerMode] = useState<"normal" | "satellite">("normal");
  const [showTraffic, setShowTraffic] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<SmartMapMarker | null>(null);

  const { isLoaded, isError } = useLongdoMap({ apiVersion: "v3" });

  // Initialize Longdo Map Instance
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = new longdo.Map({
      placeholder: mapContainerRef.current,
      language: "th",
      zoom: zoom,
      location: { lon: center.lng, lat: center.lat },
    });

    // Configure Minimal Modern Controls
    map.Ui.DPad.visible(false);
    map.Ui.Zoombar.visible(true);
    map.Ui.LayerSelector.visible(false);
    map.Ui.Geolocation.visible(false);
    map.Ui.Toolbar.visible(false);
    map.Ui.Scale.visible(true);

    if (enable3D && typeof map.projection === "function") {
      try {
        map.pitch(35);
      } catch (_) {}
    }

    // Map Click Listener for Coordinates / Reverse Geocoding
    if (onMapClick) {
      longdo.Event.bind(map, "click", (overlay: any) => {
        const mouseLoc = map.location(longdo.LocationMode.Pointer);
        if (mouseLoc && mouseLoc.lat && mouseLoc.lon) {
          onMapClick({ lat: mouseLoc.lat, lng: mouseLoc.lon });
        }
      });
    }

    mapInstanceRef.current = map;
  }, [isLoaded, center.lat, center.lng, zoom, enable3D]);

  // Update Base Layer (Normal vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = mapInstanceRef.current;
    if (layerMode === "satellite") {
      map.Layers.setBase(longdo.Layers.SATELLITE);
    } else {
      map.Layers.setBase(longdo.Layers.NORMAL);
    }
  }, [layerMode, isLoaded]);

  // Toggle Traffic Layer
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

  // Render All Overlays (Markers, Geofence Circles, Polygons, Polylines)
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = mapInstanceRef.current;

    // Clear previous overlays
    overlaysRef.current.forEach((overlay) => map.Overlays.remove(overlay));
    overlaysRef.current = [];

    // 1. Render Polygons (Boundaries / Isochrones / Restricted Areas)
    polygons.forEach((poly) => {
      if (!poly.points || poly.points.length < 3) return;
      const longdoPoints = poly.points.map((p) => ({ lon: p.lng, lat: p.lat }));
      const polygonOverlay = new longdo.Polygon(longdoPoints, {
        title: poly.title,
        lineWidth: 2,
        lineColor: poly.color || "#6366f1",
        fillColor: (poly.color || "#6366f1") + "22",
      });
      map.Overlays.add(polygonOverlay);
      overlaysRef.current.push(polygonOverlay);
    });

    // 2. Render Circles (Geofence Radius)
    circles.forEach((c) => {
      const color = c.color || "#10b981";
      const circleOverlay = new longdo.Circle(
        { lon: c.lng, lat: c.lat },
        c.radius,
        {
          title: c.title,
          lineWidth: 2,
          lineColor: color,
          fillColor: color + "25",
        }
      );
      map.Overlays.add(circleOverlay);
      overlaysRef.current.push(circleOverlay);
    });

    // 3. Render Polylines (Routes / Tracks)
    polylines.forEach((line) => {
      if (!line.points || line.points.length < 2) return;
      const longdoPoints = line.points.map((p) => ({ lon: p.lng, lat: p.lat }));
      const polylineOverlay = new longdo.Polyline(longdoPoints, {
        lineWidth: line.width || 4,
        lineColor: line.color || "#3b82f6",
      });
      map.Overlays.add(polylineOverlay);
      overlaysRef.current.push(polylineOverlay);
    });

    // 4. Render Markers
    markers.forEach((m) => {
      const markerColor =
        m.color ||
        (m.status === "ALERT"
          ? "#f43f5e"
          : m.status === "WARNING"
          ? "#f59e0b"
          : "#10b981");

      const iconSymbol =
        m.category === "EMPLOYEE"
          ? "👤"
          : m.category === "VEHICLE"
          ? "🚚"
          : m.category === "INCIDENT"
          ? "🚨"
          : m.category === "WORK_ORDER"
          ? "📋"
          : "🏢";

      const markerHtml = `
        <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.35));transition:transform 0.15s ease;">
          <div style="width:34px;height:34px;border-radius:12px;background:${markerColor};border:2.5px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:bold;">
            ${iconSymbol}
          </div>
          <div style="margin-top:3px;padding:2px 7px;border-radius:6px;background:rgba(15,23,42,0.9);color:white;font-size:10px;font-weight:bold;white-space:nowrap;border:1px solid rgba(255,255,255,0.15);">
            ${m.title}
          </div>
        </div>
      `;

      const popupDetail = m.detailHtml || `
        <div style="font-family:sans-serif;padding:4px;min-width:180px">
          <strong style="color:#0f172a;font-size:12px">${m.title}</strong>
          ${m.subtitle ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${m.subtitle}</div>` : ""}
          ${m.status ? `<div style="font-size:10px;font-weight:bold;color:${markerColor};margin-top:4px">สถานะ: ${m.status}</div>` : ""}
        </div>
      `;

      const markerOverlay = new longdo.Marker(
        { lon: m.lng, lat: m.lat },
        {
          icon: { html: markerHtml, offset: { x: 17, y: 44 } },
          popup: { title: m.title, detail: popupDetail },
          clickable: true,
        }
      );

      map.Overlays.add(markerOverlay);
      overlaysRef.current.push(markerOverlay);

      longdo.Event.bind(markerOverlay, "click", () => {
        setSelectedMarker(m);
        if (onMarkerSelect) onMarkerSelect(m);
        if (m.onClick) m.onClick();
      });
    });
  }, [markers, circles, polygons, polylines, isLoaded]);

  // Autocomplete Search Handler via Proxy API
  const handleSearchInput = async (val: string) => {
    setSearchQuery(val);
    if (val.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/map/suggest?q=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (_) {
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = async (item: any) => {
    setSuggestions([]);
    setSearchQuery(item.word);
    try {
      const res = await fetch(`/api/map/search?q=${encodeURIComponent(item.word)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.places && data.places.length > 0) {
          const place = data.places[0];
          if (mapInstanceRef.current && isLoaded) {
            mapInstanceRef.current.location({ lon: place.lng, lat: place.lat }, true);
            mapInstanceRef.current.zoom(15, true);
          }
        }
      }
    } catch (_) {}
  };

  // Browser Geolocation / Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("อุปกรณ์หรือเบราว์เซอร์ไม่รองรับ GPS");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current && isLoaded) {
          mapInstanceRef.current.location({ lon: longitude, lat: latitude }, true);
          mapInstanceRef.current.zoom(15, true);
        }
      },
      (err) => {
        alert("ไม่สามารถเข้าถึงตำแหน่ง GPS ของคุณได้");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div
      className={cn(
        "relative bg-surface-card border border-surface-border rounded-3xl overflow-hidden shadow-sm transition-all duration-300 font-sans",
        isFullscreen ? "fixed inset-2 sm:inset-4 z-50 rounded-2xl shadow-2xl" : "w-full",
        className
      )}
    >
      {/* Top Controls Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Search Bar */}
        {showSearch && (
          <div className="relative flex-1 max-w-sm pointer-events-auto">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="smart-map-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                placeholder="ค้นหาสถานที่ในแผนที่ Longdo..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-2xl bg-slate-950/85 backdrop-blur-md text-white placeholder:text-slate-400 border border-white/15 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-950/95 backdrop-blur-md border border-white/15 rounded-2xl overflow-hidden shadow-2xl z-30 max-h-48 overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-3 py-2 hover:bg-brand-600/30 text-white text-xs border-b border-white/5 last:border-0 flex items-center justify-between"
                  >
                    <span className="font-bold truncate">{s.word}</span>
                    {s.category && (
                      <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-white/10">
                        {s.category}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Right Floating Control Group */}
        <div className="flex items-center gap-1.5 pointer-events-auto ml-auto">
          {/* Traffic Toggle */}
          {showTrafficToggle && (
            <button
              id="smart-map-traffic-btn"
              onClick={() => setShowTraffic(!showTraffic)}
              className={cn(
                "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all backdrop-blur-md shadow-md flex items-center gap-1.5",
                showTraffic
                  ? "bg-rose-500 text-white border-rose-400"
                  : "bg-slate-950/85 text-slate-200 border-white/15 hover:bg-slate-900"
              )}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">จราจร</span>
            </button>
          )}

          {/* Layer Toggle */}
          {showLayerToggle && (
            <button
              id="smart-map-layer-btn"
              onClick={() => setLayerMode(layerMode === "normal" ? "satellite" : "normal")}
              className="px-3 py-1.5 rounded-xl bg-slate-950/85 text-slate-200 border border-white/15 hover:bg-slate-900 text-xs font-bold transition-all backdrop-blur-md shadow-md flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{layerMode === "normal" ? "ดาวเทียม" : "แผนที่"}</span>
            </button>
          )}

          {/* Locate Me */}
          {showLocateMe && (
            <button
              id="smart-map-locate-btn"
              onClick={handleLocateMe}
              className="p-2 rounded-xl bg-slate-950/85 text-slate-200 border border-white/15 hover:bg-slate-900 transition-all backdrop-blur-md shadow-md"
              title="ตำแหน่งของฉัน"
            >
              <Locate className="w-3.5 h-3.5 text-brand-400" />
            </button>
          )}

          {/* Fullscreen Toggle */}
          {showFullscreen && (
            <button
              id="smart-map-fullscreen-btn"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-950/85 text-slate-200 border border-white/15 hover:bg-slate-900 transition-all backdrop-blur-md shadow-md"
              title={isFullscreen ? "ย่อหน้าจอ" : "ขยายเต็มจอ"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Map Canvas */}
      <div className={`relative w-full ${height} ${isFullscreen ? "h-full" : ""}`}>
        {!isLoaded && !isError && (
          <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center gap-3 text-white">
            <div className="w-9 h-9 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">กำลังโหลด Longdo Map Intelligence...</p>
          </div>
        )}

        {isError && (
          <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center gap-2 text-white">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            <p className="text-xs text-slate-400">ไม่สามารถเชื่อมต่อบริการ Longdo Map ได้</p>
          </div>
        )}

        <div ref={mapContainerRef} className="w-full h-full bg-slate-900 z-0" />

        {/* Attribution Badge */}
        <div className="absolute bottom-2 left-2 z-10 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full backdrop-blur-sm">
          Longdo Map API © Metamedia Technology
        </div>
      </div>
    </div>
  );
}
