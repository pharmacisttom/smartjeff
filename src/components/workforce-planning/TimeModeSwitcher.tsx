"use client";

import { Radio, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeModeSwitcherProps {
  mode: "today" | "tomorrow" | "custom";
  onModeChange: (mode: "today" | "tomorrow" | "custom") => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  className?: string;
}

export function TimeModeSwitcher({
  mode,
  onModeChange,
  selectedDate,
  onDateChange,
  className,
}: TimeModeSwitcherProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2 rounded-2xl shadow-xl",
        className
      )}
    >
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
        <button
          onClick={() => onModeChange("today")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
            mode === "today"
              ? "bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/40"
              : "text-slate-400 hover:text-white"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          <span>🔴 LIVE (ปฏิบัติการจริงวันนี้)</span>
        </button>

        <button
          onClick={() => onModeChange("tomorrow")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
            mode === "tomorrow"
              ? "bg-indigo-600 text-white shadow-md ring-1 ring-indigo-400/40"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>📅 PLANNING (วางแผนพรุ่งนี้)</span>
        </button>

        <button
          onClick={() => onModeChange("custom")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
            mode === "custom"
              ? "bg-brand-600 text-white shadow-md ring-1 ring-brand-400/40"
              : "text-slate-400 hover:text-white"
          )}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>เลือกวันที่ล่วงหน้า</span>
        </button>
      </div>

      {mode === "custom" && (
        <div className="flex items-center gap-2 px-2">
          <span className="text-xs text-slate-400 font-medium">วันที่วางแผน:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-white text-xs px-3 py-1 rounded-xl outline-none"
          />
        </div>
      )}

      <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-400 px-3">
        {mode === "today" ? (
          <span className="text-emerald-400 font-mono font-medium">
            ● ข้อมูลสดจาก Attendance จริงของวันนี้
          </span>
        ) : (
          <span className="text-indigo-400 font-mono font-medium">
            ★ โหมดจำลองประมาณการกำลังพลตาม Roster และใบลาที่อนุมัติ
          </span>
        )}
      </div>
    </div>
  );
}
