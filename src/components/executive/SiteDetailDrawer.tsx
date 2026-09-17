"use client";

import { useEffect, useState } from "react";
import {
  X,
  Building2,
  Users,
  Briefcase,
  Clock,
  CalendarOff,
  UserX,
  Zap,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteSummaryData } from "@/server/services/executive-operations.service";

interface SiteDetailDrawerProps {
  site: SiteSummaryData | null;
  onClose: () => void;
  dateStr?: string;
}

export function SiteDetailDrawer({ site, onClose, dateStr }: SiteDetailDrawerProps) {
  const [detail, setDetail] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"ROSTER" | "ACTIVITY">("ROSTER");

  useEffect(() => {
    if (!site) {
      setDetail(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchDetail = async () => {
      try {
        const query = dateStr ? `?date=${dateStr}` : "";
        const res = await fetch(`/api/executive/sites/${site.id}/live${query}`);
        const json = await res.json();
        if (isMounted && json.success) {
          setDetail(json.data);
        }
      } catch (err) {
        console.error("Failed to load site detail:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [site, dateStr]);

  if (!site) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "WORKING":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">WORKING</span>;
      case "OT":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">OT ACTIVE</span>;
      case "FINISHED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50">FINISHED</span>;
      case "LEAVE":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">LEAVE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">NOT CHECKED IN</span>;
    }
  };

  const formatTime = (iso?: string | null) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
    } catch {
      return "-";
    }
  };

  const utilization = detail?.metrics?.utilization ?? site.utilization;
  const workingCount = detail?.metrics?.working ?? site.working;
  const assignedCount = detail?.metrics?.assigned ?? site.assignedEmployees;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container: Responsive bottom-sheet on mobile, right-drawer on desktop */}
      <div
        className={cn(
          "fixed z-50 bg-slate-900 border-slate-800 shadow-2xl flex flex-col transition-all duration-300",
          // Mobile: Bottom sheet
          "inset-x-0 bottom-0 rounded-t-3xl max-h-[85vh] border-t",
          // Desktop: Right side drawer
          "md:inset-y-0 md:right-0 md:left-auto md:w-[480px] md:max-h-full md:rounded-none md:border-l md:border-t-0"
        )}
      >
        {/* Mobile drag handle */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 mb-1 md:hidden" />

        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand-600 text-white">
                {site.code}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                  site.status === "ACTIVE"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : site.status === "LOW_STAFF"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : site.status === "EMPTY"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : site.status === "OT_ACTIVE"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                    : "bg-rose-500 text-white"
                )}
              >
                {site.status}
              </span>
            </div>

            <h2 className="text-lg font-black text-white truncate leading-tight">
              {site.name}
            </h2>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span className="truncate">{site.location || "ไม่ระบุที่ตั้ง"}</span>
              <span className="text-slate-600">•</span>
              <span>รัศมี {site.radius}m</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workforce Utilization Progress */}
        <div className="px-5 py-4 bg-slate-950/50 border-b border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300">Workforce Utilization</span>
            <span className="font-black text-brand-400 text-sm">
              {workingCount} / {assignedCount} คน ({utilization}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                utilization >= 80
                  ? "bg-emerald-500"
                  : utilization >= 50
                  ? "bg-amber-500"
                  : "bg-rose-500"
              )}
              style={{ width: `${Math.min(100, Math.max(0, utilization))}%` }}
            />
          </div>

          {/* Quick Metrics Pills */}
          <div className="grid grid-cols-4 gap-2 pt-1 text-center">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">กำลังทำงาน</div>
              <div className="text-sm font-black text-emerald-400">{workingCount}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">มาสาย</div>
              <div className="text-sm font-black text-amber-400">{detail?.metrics?.late ?? site.late}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">ลา</div>
              <div className="text-sm font-black text-purple-400">{detail?.metrics?.leave ?? site.leave}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-[10px] text-slate-400">ยังไม่ลงเวลา</div>
              <div className="text-sm font-black text-slate-400">{detail?.metrics?.absent ?? site.absent}</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab("ROSTER")}
            className={cn(
              "flex-1 py-3 text-center transition-all border-b-2",
              activeTab === "ROSTER"
                ? "border-brand-500 text-white bg-slate-800/40"
                : "border-transparent text-slate-400 hover:text-white"
            )}
          >
            รายชื่อพนักงานประจำไซต์ ({assignedCount})
          </button>
          <button
            onClick={() => setActiveTab("ACTIVITY")}
            className={cn(
              "flex-1 py-3 text-center transition-all border-b-2",
              activeTab === "ACTIVITY"
                ? "border-brand-500 text-white bg-slate-800/40"
                : "border-transparent text-slate-400 hover:text-white"
            )}
          >
            ประวัติการลงเวลาล่าสุด
          </button>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-3">
          {loading && !detail ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
              <span className="text-xs">กำลังโหลดข้อมูลไซต์...</span>
            </div>
          ) : activeTab === "ROSTER" ? (
            <div className="space-y-2">
              {detail?.employees?.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  ไม่มีพนักงานลงทะเบียนประจำไซต์นี้
                </div>
              ) : (
                detail?.employees?.map((emp: any) => (
                  <div
                    key={emp.employeeId}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {emp.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({emp.code})
                        </span>
                        {emp.isLate && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                            สาย
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 truncate">
                        {emp.position}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>เข้า: {formatTime(emp.checkIn)}</span>
                        {emp.checkOut && <span>ออก: {formatTime(emp.checkOut)}</span>}
                        {emp.withinGeofence !== null && (
                          <span
                            className={cn(
                              "flex items-center gap-0.5 font-bold",
                              emp.withinGeofence ? "text-emerald-400" : "text-rose-400"
                            )}
                          >
                            {emp.withinGeofence ? (
                              <>
                                <ShieldCheck className="w-3 h-3" /> ในพิกัด
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-3 h-3" /> นอกพิกัด ({emp.distance}m)
                              </>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">{getStatusBadge(emp.status)}</div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {detail?.recentActivities?.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  ยังไม่มีการลงเวลาในวันนี้
                </div>
              ) : (
                detail?.recentActivities?.map((act: any) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white">
                        {formatTime(act.time)} {act.employeeName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {act.type} • ห่าง {act.distance}m (คลาดเคลื่อน ±{act.accuracy}m)
                      </div>
                    </div>

                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        act.withinGeofence
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      )}
                    >
                      {act.withinGeofence ? "ใน Geofence" : "นอกพื้นที่"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
          <a
            href={`/admin/attendance?siteId=${site.id}`}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-center transition-colors flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ดูประวัติลงเวลา</span>
          </a>

          <a
            href={`/admin/sites`}
            className="py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>จัดการไซต์</span>
          </a>
        </div>
      </div>
    </>
  );
}
