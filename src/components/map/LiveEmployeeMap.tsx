"use client";

import { useState } from "react";
import { MapPin, Users, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
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
  { id: "1", name: "สมชาย เข็มกลัด", siteName: "โรงงาน AAM มาบตาพุด", lat: 12.682, lng: 101.173, status: "WORKING", lastSeen: "07:55 น." },
  { id: "2", name: "พัดมา วงค์คำ", siteName: "อมตะ ซิตี้ ระยอง", lat: 12.981, lng: 101.102, status: "LATE", lastSeen: "08:14 น." },
  { id: "3", name: "วิชัย ใจดี", siteName: "สำนักงานใหญ่ ชลบุรี", lat: 13.361, lng: 100.982, status: "WORKING", lastSeen: "07:48 น." },
  { id: "4", name: "นารี รุ่งเรือง", siteName: "โรงงาน AAM มาบตาพุด", lat: 12.689, lng: 101.171, status: "WORKING", lastSeen: "07:52 น." },
  { id: "5", name: "สร้อยทอง ดีมาก", siteName: "อมตะ ซิตี้ ระยอง", lat: 12.978, lng: 101.109, status: "MISSING", lastSeen: "ยังไม่ลงชื่อออก" },
];

export function LiveEmployeeMap({ employees = defaultEmployees }: LiveEmployeeMapProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [selectedEmp, setSelectedEmp] = useState<EmployeeMarkerData | null>(null);

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
          <p className="text-xs text-content-muted">แสดงตำแหน่งพนักงาน 40 คนบนแผนที่ พร้อมรัศมี Geofence 200m</p>
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

      {/* Simulated Map Visual Canvas */}
      <div className="w-full h-80 bg-slate-900 rounded-2xl relative overflow-hidden border border-slate-800 p-4 flex flex-col justify-between select-none">
        {/* Map Grid Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Geofence Circles */}
        <div className="absolute top-12 left-16 w-32 h-32 rounded-full border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
            AAM Geofence 200m
          </span>
        </div>

        <div className="absolute bottom-10 right-20 w-36 h-36 rounded-full border-2 border-dashed border-indigo-500/40 bg-indigo-500/5 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-bold text-indigo-400 bg-slate-950/80 px-2 py-0.5 rounded border border-indigo-500/30">
            อมตะซิตี้ Geofence 200m
          </span>
        </div>

        {/* Employee Markers */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmp(emp)}
              className={cn(
                "p-3 rounded-2xl border transition-all cursor-pointer shadow-md backdrop-blur-md flex items-center justify-between",
                emp.status === "WORKING"
                  ? "bg-emerald-950/40 border-emerald-500/40 hover:border-emerald-400"
                  : emp.status === "LATE"
                  ? "bg-amber-950/40 border-amber-500/40 hover:border-amber-400"
                  : "bg-rose-950/40 border-rose-500/40 hover:border-rose-400"
              )}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full animate-ping",
                      emp.status === "WORKING"
                        ? "bg-emerald-400"
                        : emp.status === "LATE"
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    )}
                  />
                  <span className="font-bold text-white text-xs">{emp.name}</span>
                </div>
                <p className="text-[10px] text-slate-300 truncate max-w-[140px]">{emp.siteName}</p>
              </div>

              <span className="text-[10px] font-mono text-slate-400 bg-slate-950/60 px-2 py-1 rounded">
                {emp.lastSeen}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom Legend */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>ปกติ {employees.filter((e) => e.status === "WORKING").length}</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>สาย {employees.filter((e) => e.status === "LATE").length}</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>ยังไม่เช็คเอาท์ {employees.filter((e) => e.status === "MISSING").length}</span>
            </span>
          </div>

          <span className="text-[10px] text-slate-400">อัปเดตตำแหน่งแบบ WebSocket Real-time</span>
        </div>
      </div>
    </div>
  );
}
