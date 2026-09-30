"use client";

import { useState } from "react";
import { SmartLongdoMap, SmartMapMarker, SmartMapCircle } from "./SmartLongdoMap";
import { MapPin, ShieldCheck, Users, Search, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmployeeLocationItem {
  id: string;
  name: string;
  code: string;
  siteName: string;
  siteId?: string;
  lat: number;
  lng: number;
  status: "WORKING" | "LATE" | "OUTSIDE_GEOFENCE" | "OFF" | "NO_SIGNAL";
  lastSeen: string;
  distanceFromSiteMeters?: number;
  department?: string;
  role?: string;
}

export interface SiteGeofenceItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  color?: string;
}

interface LiveEmployeeMapProps {
  employees?: EmployeeLocationItem[];
  sites?: SiteGeofenceItem[];
  onRefresh?: () => void;
}

const defaultEmployeesDemo: EmployeeLocationItem[] = [
  { id: "1", code: "EMP-001", name: "สมชาย เข็มกลัด", siteName: "โรงงาน AAM เหมราช ระยอง", lat: 13.0039, lng: 101.1668, status: "WORKING", lastSeen: "07:55 น.", distanceFromSiteMeters: 45, department: "ฝ่ายผลิต" },
  { id: "2", code: "EMP-002", name: "พัดมา วงค์คำ", siteName: "อมตะ ซิตี้ ระยอง", lat: 12.975, lng: 101.135, status: "LATE", lastSeen: "08:14 น.", distanceFromSiteMeters: 120, department: "ซ่อมบำรุง" },
  { id: "3", code: "EMP-003", name: "วิชัย ใจดี", siteName: "สำนักงานใหญ่ ปลวกแดง", lat: 12.9734, lng: 101.2155, status: "WORKING", lastSeen: "07:48 น.", distanceFromSiteMeters: 30, department: "บริหาร" },
  { id: "4", code: "EMP-004", name: "นารี รุ่งเรือง", siteName: "โรงงาน BAT นิคมฯ เหมราช", lat: 12.9961, lng: 101.1712, status: "WORKING", lastSeen: "07:52 น.", distanceFromSiteMeters: 60, department: "คลังสินค้า" },
  { id: "5", code: "EMP-005", name: "สร้อยทอง ดีมาก", siteName: "อมตะ ซิตี้ ระยอง", lat: 12.9765, lng: 101.137, status: "OUTSIDE_GEOFENCE", lastSeen: "ยังไม่ลงชื่อออก", distanceFromSiteMeters: 650, department: "โลจิสติกส์" },
  { id: "6", code: "EMP-006", name: "ปณิธาน สดใส", siteName: "ท่าเรือแหลมฉบัง LCIT", lat: 13.0827, lng: 100.8845, status: "WORKING", lastSeen: "07:40 น.", distanceFromSiteMeters: 80, department: "ความปลอดภัย" },
];

const defaultSitesDemo: SiteGeofenceItem[] = [
  { id: "s1", name: "นิคมฯ เหมราช ระยอง", lat: 13.0039, lng: 101.1668, radius: 500, color: "#10b981" },
  { id: "s2", name: "อมตะ ซิตี้ ระยอง", lat: 12.975, lng: 101.135, radius: 400, color: "#6366f1" },
  { id: "s3", name: "อีสเทิร์นซีบอร์ด ปลวกแดง", lat: 12.9734, lng: 101.2155, radius: 350, color: "#f59e0b" },
  { id: "s4", name: "ท่าเรือแหลมฉบัง", lat: 13.0827, lng: 100.8845, radius: 600, color: "#3b82f6" },
];

export function LiveEmployeeMap({
  employees = defaultEmployeesDemo,
  sites = defaultSitesDemo,
  onRefresh,
}: LiveEmployeeMapProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedEmp, setSelectedEmp] = useState<EmployeeLocationItem | null>(null);

  const filteredEmployees = employees.filter((e) =>
    filterStatus === "ALL" ? true : e.status === filterStatus
  );

  const stats = {
    total: employees.length,
    working: employees.filter((e) => e.status === "WORKING").length,
    late: employees.filter((e) => e.status === "LATE").length,
    outside: employees.filter((e) => e.status === "OUTSIDE_GEOFENCE").length,
  };

  const markers: SmartMapMarker[] = filteredEmployees.map((emp) => ({
    id: emp.id,
    lat: emp.lat,
    lng: emp.lng,
    title: emp.name,
    subtitle: `${emp.siteName} (${emp.lastSeen})`,
    category: "EMPLOYEE",
    status: emp.status,
    color:
      emp.status === "WORKING"
        ? "#10b981"
        : emp.status === "LATE"
        ? "#f59e0b"
        : emp.status === "OUTSIDE_GEOFENCE"
        ? "#f43f5e"
        : "#64748b",
    detailHtml: `
      <div style="font-family:sans-serif;padding:6px;min-width:200px">
        <div style="font-size:12px;font-weight:bold;color:#0f172a">${emp.name} (${emp.code})</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">ประจำที่: ${emp.siteName}</div>
        <div style="font-size:11px;color:#475569;margin-top:2px">แผนก: ${emp.department || "-"}</div>
        <div style="font-size:11px;margin-top:4px;font-weight:bold;color:${
          emp.status === "WORKING" ? "#15803d" : emp.status === "LATE" ? "#b45309" : "#b91c1c"
        }">
          สถานะ: ${
            emp.status === "WORKING"
              ? "ปกติ (ตรงเวลา)"
              : emp.status === "LATE"
              ? "มาสาย"
              : emp.status === "OUTSIDE_GEOFENCE"
              ? "นอกพื้นที่ Geofence"
              : "ออกกะ"
          } (${emp.lastSeen})
        </div>
        ${emp.distanceFromSiteMeters ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">ระยะห่างจากศูนย์กลางไซต์: ${emp.distanceFromSiteMeters} ม.</div>` : ""}
      </div>
    `,
    onClick: () => setSelectedEmp(emp),
  }));

  const circles: SmartMapCircle[] = sites.map((s) => ({
    id: s.id,
    lat: s.lat,
    lng: s.lng,
    radius: s.radius,
    color: s.color || "#10b981",
    title: s.name,
  }));

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-5 shadow-sm space-y-4 font-sans">
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
            ติดตามพิกัดพนักงานล่าสุด รัศมี Geofence และสถานะเข้าปฏิบัติงาน
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-surface-subtle hover:bg-surface-border text-content-secondary transition-all"
              title="รีเฟรชข้อมูลตำแหน่ง"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="px-2.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              ✓ ปกติ {stats.working}
            </span>
            <span className="px-2.5 py-1.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
              ⚠ สาย {stats.late}
            </span>
            <span className="px-2.5 py-1.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
              🚨 นอกพื้นที่ {stats.outside}
            </span>
          </div>
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto pb-1">
        {[
          { key: "ALL", label: "ทั้งหมด", count: stats.total },
          { key: "WORKING", label: "ปกติ", count: stats.working },
          { key: "LATE", label: "มาสาย", count: stats.late },
          { key: "OUTSIDE_GEOFENCE", label: "นอก Geofence", count: stats.outside },
        ].map((f) => (
          <button
            key={f.key}
            id={`emp-filter-${f.key.toLowerCase()}`}
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

      {/* SmartLongdoMap Component */}
      <SmartLongdoMap
        center={{ lat: 13.0, lng: 101.15 }}
        zoom={11}
        height="h-96"
        markers={markers}
        circles={circles}
      />

      {/* Selected Employee Card */}
      {selectedEmp && (
        <div className="p-3 bg-surface-subtle rounded-2xl border border-surface-border flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-content-primary">{selectedEmp.name} ({selectedEmp.code})</span>
            <span className="text-content-muted ml-2">ประจำ {selectedEmp.siteName}</span>
          </div>
          <button
            onClick={() => setSelectedEmp(null)}
            className="text-xs font-bold text-brand-600 hover:underline"
          >
            ปิด
          </button>
        </div>
      )}
    </div>
  );
}
