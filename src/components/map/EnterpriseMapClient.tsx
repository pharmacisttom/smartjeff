"use client";

import { useEffect, useState } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface EmployeeMapData {
  id: string;
  code: string;
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "UNSPECIFIED";
  position: string;
  siteName: string;
  shiftName: string;
  status: "WORKING" | "LATE" | "LEAVE" | "OT_ACTIVE" | "NOT_CHECKED_IN";
  latestEvent: {
    id: string;
    type: string;
    timestamp: string;
    lat: number;
    lng: number;
    withinGeofence: boolean;
  } | null;
}

export interface OperationsSite {
  id: string;
  code: string;
  name: string;
  lat: number | null;
  lng: number | null;
  radius: number;
  status: string;
  required: number;
  planned: number;
  working: number;
  late: number;
  leave: number;
  notCheckedIn: number;
  ot: number;
  alerts: number;
  employees: EmployeeMapData[];
}

const statusColors: Record<string, { bg: string; border: string; label: string }> = {
  WORKING: { bg: "#10b981", border: "#059669", label: "ปฏิบัติงาน" },
  LATE: { bg: "#f59e0b", border: "#d97706", label: "มาสาย" },
  LEAVE: { bg: "#8b5cf6", border: "#7c3aed", label: "ลา" },
  OT_ACTIVE: { bg: "#3b82f6", border: "#2563eb", label: "ทำ OT" },
  NOT_CHECKED_IN: { bg: "#64748b", border: "#475569", label: "ยังไม่ลงเวลา" },
  ALERT: { bg: "#ef4444", border: "#dc2626", label: "แจ้งเตือน" },
};

const genderLabels: Record<string, string> = {
  MALE: "ชาย ♂",
  FEMALE: "หญิง ♀",
  OTHER: "อื่น ๆ 👤",
  UNSPECIFIED: "ไม่ระบุ 👤",
};

/**
 * Creates custom divIcon for Leaflet with dual dimensions:
 * Dimension 1: Gender (Shape + Icon indicator: Square = Male, Circle = Female, Diamond = Neutral)
 * Dimension 2: Work Status (Border ring color & badge)
 */
function createEmployeeDivIcon(gender: string, status: string, isAlert: boolean) {
  const statusConfig = isAlert ? statusColors.ALERT : statusColors[status] || statusColors.WORKING;

  let shapeClass = "rounded-xl"; // Default MALE (Square badge)
  let badgeSymbol = "♂";

  if (gender === "FEMALE") {
    shapeClass = "rounded-full"; // FEMALE (Circle badge)
    badgeSymbol = "♀";
  } else if (gender === "OTHER" || gender === "UNSPECIFIED") {
    shapeClass = "rotate-45 rounded-md"; // OTHER / UNSPECIFIED (Diamond shape)
    badgeSymbol = "👤";
  }

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
      ${isAlert ? `<div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.4); animation: ping 1.5s infinite;"></div>` : ""}
      <div class="${shapeClass}" style="
        width: 28px;
        height: 28px;
        background-color: ${statusConfig.bg};
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 13px;
        line-height: 1;
      ">
        <span style="${gender === "OTHER" || gender === "UNSPECIFIED" ? "transform: rotate(-45deg);" : ""}">${badgeSymbol}</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-employee-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function EnterpriseMapClient({ sites }: { sites: OperationsSite[] }) {
  const [legendOpen, setLegendOpen] = useState(true);

  const mappedSites = sites.filter((site) => site.lat != null && site.lng != null);
  const center: [number, number] = mappedSites.length
    ? [mappedSites[0].lat!, mappedSites[0].lng!]
    : [13.7563, 100.5018]; // Default Bangkok coordinates

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-surface-border">
      <MapContainer
        center={center}
        zoom={9}
        scrollWheelZoom
        className="h-[520px] w-full z-10"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Site Geofence Circles */}
        {mappedSites.map((site) => {
          const color = site.status === "EMPTY" ? "#ef4444" : site.status === "LOW_STAFF" ? "#f59e0b" : "#10b981";
          return (
            <Circle
              key={site.id}
              center={[site.lat!, site.lng!]}
              radius={site.radius}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 2 }}
            >
              <Popup>
                <div className="min-w-56 space-y-1.5 p-1 text-xs text-slate-800 font-sans">
                  <div className="font-bold text-sm text-slate-900">{site.name}</div>
                  <div className="font-mono text-slate-500">รหัสไซต์: {site.code}</div>
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-2 font-medium">
                    <div>กำลังคน: <strong>{site.working}/{site.required}</strong></div>
                    <div>วางแผน: <strong>{site.planned}</strong></div>
                    <div>มาสาย: <span className="text-amber-700">{site.late}</span></div>
                    <div>การลา: <span className="text-purple-700">{site.leave}</span></div>
                    <div>OT: <span className="text-blue-700">{site.ot}</span></div>
                    <div>แจ้งเตือน: <span className="text-rose-700">{site.alerts}</span></div>
                  </div>
                </div>
              </Popup>
            </Circle>
          );
        })}

        {/* Employee Map Markers */}
        {mappedSites.flatMap((site) =>
          site.employees
            .filter((emp) => emp.latestEvent != null)
            .map((emp) => {
              const event = emp.latestEvent!;
              const isAlert = !event.withinGeofence;
              const icon = createEmployeeDivIcon(emp.gender, emp.status, isAlert);

              return (
                <Marker
                  key={emp.id + event.timestamp}
                  position={[event.lat, event.lng]}
                  icon={icon}
                >
                  <Popup>
                    <div className="min-w-60 space-y-2 p-1 text-xs text-slate-800 font-sans">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{emp.name}</h4>
                          <p className="font-mono text-[11px] text-slate-500">{emp.code}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {genderLabels[emp.gender] || genderLabels.UNSPECIFIED}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div><strong>ตำแหน่ง:</strong> {emp.position}</div>
                        <div><strong>ไซต์งาน:</strong> {emp.siteName}</div>
                        <div><strong>กะการทำงาน:</strong> {emp.shiftName}</div>
                        <div className="flex items-center gap-1.5">
                          <strong>สถานะ:</strong>
                          <span
                            className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ backgroundColor: isAlert ? statusColors.ALERT.bg : statusColors[emp.status]?.bg }}
                          >
                            {isAlert ? "ออกนอก Geofence" : statusColors[emp.status]?.label || emp.status}
                          </span>
                        </div>
                        <div><strong>เวลาลงล่าสุด:</strong> {new Date(event.timestamp).toLocaleString("th-TH")}</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })
        )}
      </MapContainer>

      {/* Thai Map Legend Overlay */}
      <div className="absolute bottom-3 right-3 z-20 rounded-2xl border border-surface-border bg-surface-card/95 p-3 shadow-xl backdrop-blur-md max-w-xs text-xs font-sans">
        <div className="flex items-center justify-between font-bold text-content-primary mb-2">
          <span>คำอธิบายสัญลักษณ์ (Legend)</span>
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className="text-[10px] text-brand-600 dark:text-brand-400 hover:underline"
          >
            {legendOpen ? "ซ่อน" : "แสดง"}
          </button>
        </div>

        {legendOpen && (
          <div className="space-y-3">
            {/* Gender Legend */}
            <div>
              <p className="text-[10px] font-bold text-content-muted uppercase tracking-wider mb-1">เพศพนักงาน (Gender)</p>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] text-content-secondary">
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-[10px]">♂</span>
                  <span>ชาย</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-600 text-white font-bold text-[10px]">♀</span>
                  <span>หญิง</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md rotate-45 bg-slate-600 text-white font-bold text-[10px]"><span className="-rotate-45">👤</span></span>
                  <span>ไม่ระบุ</span>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div>
              <p className="text-[10px] font-bold text-content-muted uppercase tracking-wider mb-1">สถานะปฏิบัติงาน (Work Status)</p>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-content-secondary">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <span>ปฏิบัติงาน</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                  <span>มาสาย</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span>
                  <span>ลา</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                  <span>ทำ OT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-500"></span>
                  <span>ยังไม่ลงเวลา</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span>แจ้งเตือน</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
