"use client";

import { useState } from "react";
import { AlertTriangle, AlertCircle, Info, ChevronRight, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OperationAlert } from "@/server/services/executive-operations.service";

interface OperationsAlertPanelProps {
  alerts: OperationAlert[];
  onSelectSite?: (siteId: string) => void;
  className?: string;
}

export function OperationsAlertPanel({
  alerts,
  onSelectSite,
  className,
}: OperationsAlertPanelProps) {
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  const filtered = alerts.filter((a) => {
    if (filterSeverity === "ALL") return true;
    return a.severity === filterSeverity;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return {
          icon: ShieldAlert,
          bg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
          tagBg: "bg-rose-500 text-white",
          label: "วิกฤต",
        };
      case "WARNING":
        return {
          icon: AlertTriangle,
          bg: "bg-amber-500/15 border-amber-500/30 text-amber-300",
          tagBg: "bg-amber-500 text-slate-950 font-bold",
          label: "เตือน",
        };
      default:
        return {
          icon: Info,
          bg: "bg-blue-500/15 border-blue-500/30 text-blue-300",
          tagBg: "bg-blue-500 text-white",
          label: "แจ้งเพื่อทราบ",
        };
    }
  };

  const formatTimeOnly = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " น.";
    } catch {
      return "";
    }
  };

  return (
    <div
      className={cn(
        "bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-full",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Operations Alerts (การแจ้งเตือนหน้างาน)</h3>
            <p className="text-[11px] text-slate-400">
              พบความผิดปกติ {alerts.length} รายการ
            </p>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
          {[
            { key: "ALL", label: `ทั้งหมด (${alerts.length})` },
            { key: "CRITICAL", label: "วิกฤต" },
            { key: "WARNING", label: "เตือน" },
            { key: "INFO", label: "ข้อมูล" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterSeverity(tab.key)}
              className={cn(
                "px-2.5 py-1 rounded-lg transition-all",
                filterSeverity === tab.key
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[350px]">
        {filtered.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mb-2" />
            <p className="text-xs font-semibold text-slate-300">ทุกไซต์ปฏิบัติงานปกติ</p>
            <p className="text-[11px] text-slate-500">ไม่พบความผิดปกติหรือเหตุแจ้งเตือนในขณะนี้</p>
          </div>
        ) : (
          filtered.map((alert) => {
            const badge = getSeverityBadge(alert.severity);
            const BadgeIcon = badge.icon;
            return (
              <div
                key={alert.id}
                onClick={() => onSelectSite && onSelectSite(alert.siteId)}
                className={cn(
                  "p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 group select-none hover:translate-x-0.5",
                  badge.bg,
                  "hover:border-slate-600 hover:bg-slate-800/80"
                )}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <BadgeIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider shadow-sm"
                        style={{ backgroundColor: alert.severity === 'CRITICAL' ? '#f43f5e' : alert.severity === 'WARNING' ? '#f59e0b' : '#3b82f6', color: alert.severity === 'WARNING' ? '#0f172a' : '#fff' }}>
                        {badge.label}
                      </span>
                      <span className="text-xs font-bold text-white truncate">
                        {alert.siteName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({alert.siteCode})
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-snug break-words">
                      {alert.message}
                    </p>

                    <div className="text-[10px] text-slate-400 font-medium">
                      เวลา {formatTimeOnly(alert.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-slate-500 group-hover:text-white transition-colors self-center">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
