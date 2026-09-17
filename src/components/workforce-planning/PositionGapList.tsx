"use client";

import { Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PositionGap } from "@/server/services/workforce-planning.service";

interface PositionGapListProps {
  positionGaps: PositionGap[];
  siteName: string;
  className?: string;
}

export function PositionGapList({ positionGaps, siteName, className }: PositionGapListProps) {
  if (positionGaps.length === 0) {
    return (
      <div className={cn("p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs text-center", className)}>
        ยังไม่ได้ระบุข้อกำหนดรายตำแหน่งสำหรับ {siteName}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-white">ช่องว่างรายตำแหน่ง (Position Gap Analysis)</span>
        <span>{positionGaps.length} ตำแหน่ง</span>
      </div>

      <div className="space-y-2">
        {positionGaps.map((pos) => {
          const isShortage = pos.gap < 0;
          const isSurplus = pos.gap > 0;

          return (
            <div
              key={pos.position}
              className={cn(
                "p-3 rounded-2xl border transition-all text-xs flex items-center justify-between gap-3",
                isShortage
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : isSurplus
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                  : "bg-slate-900 border-slate-800 text-slate-300"
              )}
            >
              <div className="min-w-0">
                <div className="font-bold text-white truncate flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{pos.position}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  ทำงาน: <strong>{pos.working}</strong> / ต้องการ: <strong>{pos.required}</strong> คน
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full font-mono font-black text-xs",
                    isShortage
                      ? "bg-rose-600 text-white"
                      : isSurplus
                      ? "bg-cyan-600 text-white"
                      : "bg-emerald-600/30 text-emerald-300"
                  )}
                >
                  {pos.gap > 0 ? `+${pos.gap}` : pos.gap}
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {isShortage ? "ขาดคน" : isSurplus ? "มีคนเกิน" : "ครบตามเป้า"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
