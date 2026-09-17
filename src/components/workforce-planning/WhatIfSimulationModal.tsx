"use client";

import { X, Sparkles, ArrowRight, ShieldCheck, ShieldAlert, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SimulationResult } from "@/server/services/workforce-planning.service";

interface WhatIfSimulationModalProps {
  isOpen: boolean;
  simulation: SimulationResult | null;
  onClose: () => void;
  onProceedToDraft: () => void;
}

export function WhatIfSimulationModal({
  isOpen,
  simulation,
  onClose,
  onProceedToDraft,
}: WhatIfSimulationModalProps) {
  if (!isOpen || !simulation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span>ผลการจำลองจัดสรรกำลังพล (What-if Simulation Mode)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-lg">
            ×
          </button>
        </div>

        {/* Callout Summary */}
        <div
          className={cn(
            "p-4 rounded-2xl border text-xs space-y-1",
            simulation.sourceSite.isSafe
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
              : "bg-rose-950/40 border-rose-500/40 text-rose-200"
          )}
        >
          <div className="font-bold flex items-center gap-1.5">
            {simulation.sourceSite.isSafe ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            )}
            <span>{simulation.summaryMessage}</span>
          </div>
          <p className="text-[11px] text-slate-300">
            *การจำลองนี้เป็นเพียงการคำนวณผลกระทบเพื่อสนับสนุนการตัดสินใจ ยังไม่มีการแก้ไขฐานข้อมูลพนักงานจริง
          </p>
        </div>

        {/* Before vs After Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Target Site */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block font-bold">
              ไซต์ปลายทาง (รับกำลังพล)
            </span>
            <div className="font-bold text-white text-sm truncate">{simulation.targetSite.name}</div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ก่อนจำลอง</span>
                <span className="text-sm font-bold text-slate-300">
                  {simulation.targetSite.before.working}/{simulation.targetSite.before.target}
                </span>
                <span className="block text-[10px] text-rose-400 mt-0.5">
                  Gap: {simulation.targetSite.before.gap}
                </span>
              </div>

              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                <span className="text-[10px] text-emerald-400 block">หลังจำลอง</span>
                <span className="text-sm font-bold text-emerald-300">
                  {simulation.targetSite.after.working}/{simulation.targetSite.after.target}
                </span>
                <span className="block text-[10px] text-emerald-400 mt-0.5 font-bold">
                  Gap: {simulation.targetSite.after.gap}
                </span>
              </div>
            </div>
          </div>

          {/* Source Site */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
              ไซต์ต้นทาง (ปล่อยกำลังพล)
            </span>
            <div className="font-bold text-white text-sm truncate">{simulation.sourceSite.name}</div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-center font-mono">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">ก่อนจำลอง</span>
                <span className="text-sm font-bold text-slate-300">
                  {simulation.sourceSite.before.working}/{simulation.sourceSite.before.target}
                </span>
                <span className="block text-[10px] text-cyan-400 mt-0.5">
                  Gap: +{simulation.sourceSite.before.gap}
                </span>
              </div>

              <div
                className={cn(
                  "p-2 rounded-xl border",
                  simulation.sourceSite.isSafe
                    ? "bg-slate-900 border-slate-800"
                    : "bg-rose-950/40 border-rose-500/30"
                )}
              >
                <span className="text-[10px] text-slate-400 block">หลังจำลอง</span>
                <span className="text-sm font-bold text-white">
                  {simulation.sourceSite.after.working}/{simulation.sourceSite.after.target}
                </span>
                <span
                  className={cn(
                    "block text-[10px] mt-0.5 font-bold",
                    simulation.sourceSite.after.gap >= 0 ? "text-cyan-400" : "text-rose-400"
                  )}
                >
                  Gap: {simulation.sourceSite.after.gap}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Employees List */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
            <span>รายชื่อพนักงานที่จำลองย้าย ({simulation.reallocatedCount} คน):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {simulation.employees.map((emp) => (
              <span
                key={emp.id}
                className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium"
              >
                👤 {emp.name} ({emp.position})
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition-colors"
          >
            ปิดหน้าต่าง
          </button>

          <button
            type="button"
            onClick={onProceedToDraft}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <span>สร้างร่างแผนการจัดสรร (Create Draft Plan)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
