"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeMarkerData {
  id: string;
  name: string;
  siteName: string;
  lat: number;
  lng: number;
  status: "WORKING" | "LATE" | "MISSING" | "OFF";
  lastSeen: string;
}

interface LiveEmployeeMapProps {
  employees?: EmployeeMarkerData[];
}

const defaultEmployees: EmployeeMarkerData[] = [
  { id: "1", name: "สมชาย เข็มกลัด", siteName: "โรงงาน AAM เหมราช ระยอง", lat: 13.0039, lng: 101.1668, status: "WORKING", lastSeen: "07:55 น." },
  { id: "2", name: "พัดมา วงค์คำ", siteName: "อมตะ ซิตี้ ระยอง", lat: 12.975, lng: 101.135, status: "LATE", lastSeen: "08:14 น." },
  { id: "3", name: "วิชัย ใจดี", siteName: "สำนักงานใหญ่ ปลวกแดง", lat: 12.9734, lng: 101.2155, status: "WORKING", lastSeen: "07:48 น." },
  { id: "4", name: "นารี รุ่งเรือง", siteName: "โรงงาน BAT นิคมฯ เหมราช", lat: 12.9961, lng: 101.1712, status: "WORKING", lastSeen: "07:52 น." },
  { id: "5", name: "สร้อยทอง ดีมาก", siteName: "อมตะ ซิตี้ ระยอง", lat: 12.9765, lng: 101.137, status: "MISSING", lastSeen: "ยังไม่ลงชื่อออก" },
  { id: "6", name: "ปณิธาน สดใส", siteName: "ท่าเรือแหลมฉบัง LCIT", lat: 13.0827, lng: 100.8845, status: "WORKING", lastSeen: "07:40 น." },
];

export function LiveEmployeeMap({ employees = defaultEmployees }: LiveEmployeeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);

  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedEmp, setSelectedEmp] = useState<EmployeeMarkerData | null>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  // Dynamic Leaflet Loader
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    const linkId = "leaflet-css-bundle";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    const scriptId = "leaflet-js-bundle";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.crossOrigin = "";
      script.async = true;
      script.onload = () => setIsLeafletLoaded(true);
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if ((window as any).L) {
          setIsLeafletLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [13.0039, 101.1668],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomright" }).addTo(map);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }
  }, [isLeafletLoaded]);

  // Update Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLeafletLoaded) return;
    const L = (window as any).L;
    if (!L) return;

    const markersGroup = markersLayerRef.current;
    if (markersGroup) markersGroup.clearLayers();

    const filtered = employees.filter((e) => {
      if (filterStatus === "ALL") return true;
      return e.status === filterStatus;
    });

    const bounds = L.latLngBounds([]);

    filtered.forEach((emp) => {
      const latLng = [emp.lat, emp.lng];
      bounds.extend(latLng);

      const color =
        emp.status === "WORKING"
          ? "#10b981"
          : emp.status === "LATE"
          ? "#f59e0b"
          : "#f43f5e";

      const customIcon = L.divIcon({
        className: "custom-emp-pin",
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="background: ${color}; width: 26px; height: 26px; border-radius: 9999px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
              👤
            </div>
            <div style="background: rgba(15,23,42,0.9); color: white; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; margin-top: 2px; white-space: nowrap;">
              ${emp.name}
            </div>
          </div>
        `,
        iconSize: [40, 44],
        iconAnchor: [20, 22],
      });

      const marker = L.marker(latLng, { icon: customIcon });

      marker.bindPopup(`
        <div style="padding: 4px; font-family: sans-serif;">
          <strong style="display: block; font-size: 12px; color: #0f172a;">${emp.name}</strong>
          <span style="display: block; font-size: 10px; color: #64748b;">${emp.siteName}</span>
          <div style="margin-top: 4px; font-size: 10px; color: ${color}; font-weight: bold;">
            สถานะ: ${emp.status === "WORKING" ? "ปกติ" : emp.status === "LATE" ? "มาสาย" : "ยังไม่ลงชื่อออก"} (${emp.lastSeen})
          </div>
        </div>
      `);

      marker.on("click", () => setSelectedEmp(emp));
      markersGroup.addLayer(marker);
    });

    if (filtered.length > 0 && bounds.isValid()) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [employees, filterStatus, isLeafletLoaded]);

  const filtered = employees.filter((e) => {
    if (filterStatus === "ALL") return true;
    return e.status === filterStatus;
  });

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-sm space-y-4">
      {/* Map Header & Filter controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-content-primary text-base">แผนที่กำลังพลเรียลไทม์ (Live Operations Map)</h3>
          </div>
          <p className="text-xs text-content-muted">แสดงตำแหน่งพนักงานที่ออกปฏิบัติงานบนแผนที่ดาวเทียม GIS พร้อมสถานะ</p>
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center space-x-1.5 text-xs font-bold overflow-x-auto">
          {[
            { key: "ALL", label: "ทั้งหมด" },
            { key: "WORKING", label: "ปกติ (Working)" },
            { key: "LATE", label: "สาย (Late)" },
            { key: "MISSING", label: "ไม่ลงชื่อออก" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                filterStatus === f.key
                  ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                  : "bg-surface-subtle text-content-secondary border-surface-border hover:bg-surface-subtle/80"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Real Interactive Map Canvas */}
      <div className="w-full h-80 rounded-2xl relative overflow-hidden border border-surface-border">
        <div ref={mapContainerRef} className="w-full h-full bg-slate-900 z-0" />
      </div>

      {/* Selected Employee Info */}
      {selectedEmp && (
        <div className="p-3 bg-surface-subtle rounded-2xl border border-surface-border flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-content-primary">{selectedEmp.name}</span>
            <span className="text-content-muted ml-2">ประจำที่ {selectedEmp.siteName}</span>
          </div>
          <span
            className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              selectedEmp.status === "WORKING"
                ? "bg-emerald-500/10 text-emerald-600"
                : selectedEmp.status === "LATE"
                ? "bg-amber-500/10 text-amber-600"
                : "bg-rose-500/10 text-rose-600"
            }`}
          >
            {selectedEmp.status === "WORKING" ? "ปกติ" : selectedEmp.status === "LATE" ? "มาสาย" : "ยังไม่ลงชื่อออก"} (
            {selectedEmp.lastSeen})
          </span>
        </div>
      )}
    </div>
  );
}
