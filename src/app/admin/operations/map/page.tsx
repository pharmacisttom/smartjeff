"use client";

import { useState } from "react";
import { SmartLongdoMap, SmartMapMarker, SmartMapCircle } from "@/components/map/SmartLongdoMap";
import {
  Compass,
  Filter,
  Users,
  Building2,
  Truck,
  ShieldAlert,
  Briefcase,
  Layers,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock/Real Operational Data Interfaces
interface OpsFilterState {
  siteId: string;
  department: string;
  status: string;
  shift: string;
  searchQuery: string;
}

export default function OperationalCommandCenterPage() {
  const [filters, setFilters] = useState<OpsFilterState>({
    siteId: "ALL",
    department: "ALL",
    status: "ALL",
    shift: "ALL",
    searchQuery: "",
  });

  const [activeTab, setActiveTab] = useState<"EMPLOYEES" | "SITES" | "VEHICLES" | "INCIDENTS" | "WORK_ORDERS">("EMPLOYEES");
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Operational Markers Dataset
  const sites = [
    { id: "s1", code: "AAM-RY", name: "โรงงาน AAM เหมราช ระยอง", lat: 13.0039, lng: 101.1668, radius: 500, status: "NORMAL", headcount: "45/50" },
    { id: "s2", code: "AMT-RY", name: "อมตะ ซิตี้ ระยอง", lat: 12.975, lng: 101.135, radius: 400, status: "WARNING", headcount: "28/35" },
    { id: "s3", code: "HQ-PD", name: "สำนักงานใหญ่ ปลวกแดง", lat: 12.9734, lng: 101.2155, radius: 300, status: "NORMAL", headcount: "15/15" },
    { id: "s4", code: "LCB-PORT", name: "ท่าเรือแหลมฉบัง LCIT", lat: 13.0827, lng: 100.8845, radius: 600, status: "NORMAL", headcount: "32/32" },
  ];

  const employees = [
    { id: "e1", code: "EMP-101", name: "สมชาย เข็มกลัด", siteName: "โรงงาน AAM เหมราช ระยอง", lat: 13.0041, lng: 101.1670, status: "WORKING", lastSeen: "07:55 น.", department: "สายการผลิต" },
    { id: "e2", code: "EMP-102", name: "พัดมา วงค์คำ", siteName: "อมตะ ซิตี้ ระยอง", lat: 12.9755, lng: 101.1352, status: "LATE", lastSeen: "08:14 น.", department: "ซ่อมบำรุง" },
    { id: "e3", code: "EMP-103", name: "สร้อยทอง ดีมาก", siteName: "อมตะ ซิตี้ ระยอง", lat: 12.9780, lng: 101.1390, status: "OUTSIDE_GEOFENCE", lastSeen: "08:30 น.", department: "คลังพัสดุ" },
  ];

  const vehicles = [
    { id: "v1", code: "V-881", plateNo: "กข-5542 ระยอง", driver: "วิชัย ใจดี", lat: 12.9900, lng: 101.1850, status: "ON_TRIP", speed: 52 },
    { id: "v2", code: "V-992", plateNo: "ฮฮ-1290 ชลบุรี", driver: "นารี รุ่งเรือง", lat: 13.0400, lng: 100.9500, status: "AVAILABLE", speed: 0 },
  ];

  const incidents = [
    { id: "i1", refNo: "SOS-2026-089", title: "🚨 ท่อน้ำมันรั่วซึมบริเวณพื้นที่คลัง B", lat: 12.9745, lng: 101.1360, severity: "HIGH", status: "OPEN" },
  ];

  const workOrders = [
    { id: "w1", refNo: "WO-9011", title: "ตรวจสอบเครื่องจักรประจำสัปดาห์", siteName: "โรงงาน AAM เหมราช ระยอง", lat: 13.0035, lng: 101.1660, status: "IN_PROGRESS" },
  ];

  // Map Markers Transformation
  const mapMarkers: SmartMapMarker[] = [
    ...sites.map((s) => ({
      id: s.id,
      lat: s.lat,
      lng: s.lng,
      title: s.name,
      subtitle: `กำลังพล ${s.headcount}`,
      category: "SITE" as const,
      status: s.status,
      color: s.status === "WARNING" ? "#f59e0b" : "#3b82f6",
      onClick: () => setSelectedEntity(s),
    })),
    ...employees.map((e) => ({
      id: e.id,
      lat: e.lat,
      lng: e.lng,
      title: e.name,
      subtitle: `${e.siteName} (${e.status})`,
      category: "EMPLOYEE" as const,
      status: e.status,
      color: e.status === "WORKING" ? "#10b981" : e.status === "LATE" ? "#f59e0b" : "#f43f5e",
      onClick: () => setSelectedEntity(e),
    })),
    ...vehicles.map((v) => ({
      id: v.id,
      lat: v.lat,
      lng: v.lng,
      title: `รถ ${v.plateNo}`,
      subtitle: `พนักงานขับ: ${v.driver} (${v.speed} กม./ชม.)`,
      category: "VEHICLE" as const,
      status: v.status,
      color: "#6366f1",
      onClick: () => setSelectedEntity(v),
    })),
    ...incidents.map((inc) => ({
      id: inc.id,
      lat: inc.lat,
      lng: inc.lng,
      title: inc.title,
      subtitle: `ระดับความรุนแรง: ${inc.severity}`,
      category: "INCIDENT" as const,
      status: inc.status,
      color: "#dc2626",
      onClick: () => setSelectedEntity(inc),
    })),
  ];

  const mapCircles: SmartMapCircle[] = sites.map((s) => ({
    id: s.id,
    lat: s.lat,
    lng: s.lng,
    radius: s.radius,
    color: "#3b82f6",
    title: s.name,
  }));

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-surface-bg font-sans overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 bg-slate-950 text-white border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-brand-600 text-white shadow-md">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base tracking-tight">ศูนย์ควบคุมปฏิบัติการ GIS Command Center</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE OPS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Longdo Map Intelligence — ศูนย์รวมการสั่งการกำลังพล ยานพาหนะ ไซต์งาน และเหตุฉุกเฉิน
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">รีเฟรชสถิติ</span>
          </button>
        </div>
      </div>

      {/* 3-Column Operational Command Center Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Filter Sidebar */}
        <div className="w-full lg:w-72 bg-surface-card border-r border-surface-border p-4 space-y-4 overflow-y-auto shrink-0">
          <div className="flex items-center space-x-2 border-b border-surface-border pb-2">
            <Filter className="w-4 h-4 text-brand-600" />
            <h2 className="font-bold text-xs uppercase tracking-wider text-content-primary">ตัวกรองปฏิบัติการ</h2>
          </div>

          {/* Search */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-content-muted">ค้นหาทั่วไป</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                placeholder="ชื่อพนักงาน, รถ, ไซต์..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-xl focus:outline-none focus:border-brand-500 text-content-primary"
              />
            </div>
          </div>

          {/* Site Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-content-muted">เลือกสถานที่ / นิคมฯ</label>
            <select
              value={filters.siteId}
              onChange={(e) => setFilters({ ...filters, siteId: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-xl focus:outline-none text-content-primary"
            >
              <option value="ALL">ทุกสถานที่ (All Sites)</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-content-muted">สถานะการทำงาน</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-1.5 text-xs bg-surface-subtle border border-surface-border rounded-xl focus:outline-none text-content-primary"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="WORKING">ปกติ (In Shift)</option>
              <option value="LATE">มาสาย</option>
              <option value="OUTSIDE_GEOFENCE">นอก Geofence</option>
            </select>
          </div>

          {/* Stats Summary Widget */}
          <div className="p-3 bg-surface-subtle rounded-2xl border border-surface-border space-y-2 text-xs">
            <div className="text-[11px] font-bold text-content-muted uppercase">สรุปยอดรวมหน้างาน</div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 bg-surface-card rounded-xl border border-surface-border">
                <span className="block text-lg font-black text-emerald-600">{employees.length}</span>
                <span className="text-[10px] text-content-muted">พนักงาน</span>
              </div>
              <div className="p-2 bg-surface-card rounded-xl border border-surface-border">
                <span className="block text-lg font-black text-indigo-600">{vehicles.length}</span>
                <span className="text-[10px] text-content-muted">ยานพาหนะ</span>
              </div>
              <div className="p-2 bg-surface-card rounded-xl border border-surface-border">
                <span className="block text-lg font-black text-rose-600">{incidents.length}</span>
                <span className="text-[10px] text-content-muted">เหตุฉุกเฉิน</span>
              </div>
              <div className="p-2 bg-surface-card rounded-xl border border-surface-border">
                <span className="block text-lg font-black text-amber-600">{workOrders.length}</span>
                <span className="text-[10px] text-content-muted">ใบสั่งงาน</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Longdo Map Canvas */}
        <div className="flex-1 h-full relative border-r border-surface-border">
          <SmartLongdoMap
            center={{ lat: 13.0039, lng: 101.1668 }}
            zoom={11}
            height="h-full"
            markers={mapMarkers}
            circles={mapCircles}
          />
        </div>

        {/* Right Column: Operational Detail Panel */}
        <div className="w-full lg:w-80 bg-surface-card flex flex-col h-64 lg:h-full shrink-0">
          {/* Tabs */}
          <div className="flex items-center border-b border-surface-border bg-surface-subtle text-[11px] font-bold overflow-x-auto">
            {[
              { id: "EMPLOYEES", label: "กำลังพล", icon: Users, count: employees.length },
              { id: "SITES", label: "สถานที่", icon: Building2, count: sites.length },
              { id: "VEHICLES", label: "ฟลีตรถ", icon: Truck, count: vehicles.length },
              { id: "INCIDENTS", label: "เหตุการณ์", icon: ShieldAlert, count: incidents.length },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 py-3 px-2 flex items-center justify-center space-x-1 border-b-2 transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "border-brand-600 text-brand-600 bg-surface-card"
                      : "border-transparent text-content-muted hover:text-content-primary"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-border">{tab.count}</span>
                </button>
              );
            })}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-surface-border p-2">
            {activeTab === "EMPLOYEES" &&
              employees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => setSelectedEntity(emp)}
                  className="p-3 hover:bg-surface-subtle rounded-xl cursor-pointer transition-all space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-content-primary">{emp.name}</span>
                    <span
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border",
                        emp.status === "WORKING"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : emp.status === "LATE"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      )}
                    >
                      {emp.status === "WORKING" ? "ปกติ" : emp.status === "LATE" ? "สาย" : "นอกพื้นที่"}
                    </span>
                  </div>
                  <div className="text-[11px] text-content-muted">{emp.siteName}</div>
                </div>
              ))}

            {activeTab === "SITES" &&
              sites.map((site) => (
                <div
                  key={site.id}
                  onClick={() => setSelectedEntity(site)}
                  className="p-3 hover:bg-surface-subtle rounded-xl cursor-pointer transition-all space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-content-primary">{site.name}</span>
                    <span className="text-[10px] font-mono bg-brand-50 text-brand-600 px-2 py-0.5 rounded-md">
                      {site.headcount}
                    </span>
                  </div>
                  <div className="text-[11px] text-content-muted">รัศมี Geofence {site.radius} เมตร</div>
                </div>
              ))}

            {activeTab === "VEHICLES" &&
              vehicles.map((v) => (
                <div
                  key={v.id}
                  onClick={() => setSelectedEntity(v)}
                  className="p-3 hover:bg-surface-subtle rounded-xl cursor-pointer transition-all space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-content-primary">ทะเบียน {v.plateNo}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
                      {v.speed} กม./ชม.
                    </span>
                  </div>
                  <div className="text-[11px] text-content-muted">พนักงานขับ: {v.driver}</div>
                </div>
              ))}

            {activeTab === "INCIDENTS" &&
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedEntity(inc)}
                  className="p-3 hover:bg-rose-50 border border-rose-200 rounded-xl cursor-pointer transition-all space-y-1 text-xs"
                >
                  <div className="font-bold text-rose-700">{inc.title}</div>
                  <div className="text-[10px] text-rose-600 font-bold">{inc.refNo} • ความรุนแรง {inc.severity}</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
