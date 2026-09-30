"use client";

import { useEffect, useRef } from "react";
import { ShieldCheck } from "lucide-react";
import { useLongdoMap } from "@/hooks/useLongdoMap";

interface GeofenceSite {
  name: string;
  lat: number;
  lng: number;
  radius: number;
  color?: string;
}

interface GeofenceMapProps {
  sites?: GeofenceSite[];
  height?: string;
}

const defaultSites: GeofenceSite[] = [
  { name: "นิคมฯ เหมราช ระยอง", lat: 13.0039, lng: 101.1668, radius: 500, color: "#10b981" },
  { name: "อมตะ ซิตี้ ระยอง", lat: 12.975, lng: 101.135, radius: 400, color: "#6366f1" },
  { name: "อีสเทิร์นซีบอร์ด ปลวกแดง", lat: 12.9734, lng: 101.2155, radius: 350, color: "#f59e0b" },
  { name: "ท่าเรือแหลมฉบัง", lat: 13.0827, lng: 100.8845, radius: 600, color: "#3b82f6" },
];

export function GeofenceMap({ sites = defaultSites, height = "h-64" }: GeofenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { isLoaded } = useLongdoMap();

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    const longdo = (window as any).longdo;
    if (!longdo) return;

    const map = new longdo.Map({
      placeholder: mapContainerRef.current,
      language: "th",
    });

    map.location({ lon: 101.15, lat: 13.0 }, true);
    map.zoom(10, true);

    // Minimal UI for embedded view
    map.Ui.DPad.visible(false);
    map.Ui.Zoombar.visible(true);
    map.Ui.LayerSelector.visible(false);
    map.Ui.Geolocation.visible(false);
    map.Ui.Toolbar.visible(false);
    map.Ui.Scale.visible(false);
    map.Ui.Crosshair.visible(false);

    // Draw geofence circles
    sites.forEach((site) => {
      const color = site.color || "#10b981";

      const circle = new longdo.Circle(
        { lon: site.lng, lat: site.lat },
        site.radius,
        {
          title: site.name,
          lineWidth: 2,
          lineColor: color,
          fillColor: color + "33",
        }
      );
      map.Overlays.add(circle);

      // Site label marker
      const labelHtml = `
        <div style="background:rgba(15,23,42,0.85);color:white;padding:3px 8px;border-radius:6px;font-size:10px;font-weight:bold;white-space:nowrap;border:1px solid ${color};box-shadow:0 2px 8px rgba(0,0,0,0.3);">
          ${site.name}
        </div>
      `;
      const labelMarker = new longdo.Marker(
        { lon: site.lng, lat: site.lat },
        {
          icon: {
            html: labelHtml,
            offset: { x: 0, y: -5 },
          },
          clickable: false,
          weight: longdo.OverlayWeight.Top,
        }
      );
      map.Overlays.add(labelMarker);
    });

    mapInstanceRef.current = map;
  }, [isLoaded, sites]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-surface-border shadow-sm">
      {/* Loading skeleton */}
      {!isLoaded && (
        <div
          className={`${height} bg-slate-900 flex flex-col items-center justify-center gap-3 text-white`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">กำลังโหลดแผนที่ Geofence...</p>
        </div>
      )}

      {/* Longdo Map */}
      <div
        ref={mapContainerRef}
        className={`w-full ${height} ${!isLoaded ? "invisible" : "visible"}`}
      />

      {/* Legend Overlay */}
      {isLoaded && (
        <div className="absolute bottom-3 left-3 z-10 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2 flex flex-wrap gap-2">
          {sites.map((site) => (
            <span
              key={site.name}
              className="flex items-center gap-1.5 text-[10px] text-white font-semibold"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/30"
                style={{ background: site.color || "#10b981" }}
              />
              {site.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
