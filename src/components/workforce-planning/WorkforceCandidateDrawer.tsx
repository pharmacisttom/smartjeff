"use client";

import { useEffect, useState } from "react";
import {
  X,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SiteStaffingSummary,
  WorkforceCandidate,
} from "@/server/services/workforce-planning.service";

interface WorkforceCandidateDrawerProps {
  site: SiteStaffingSummary | null;
  onClose: () => void;
  onSimulate: (candidates: WorkforceCandidate[]) => void;
  onCreatePlan: (candidates: WorkforceCandidate[]) => void;
  className?: string;
}

export function WorkforceCandidateDrawer({
  site,
  onClose,
  onSimulate,
  onCreatePlan,
  className,
}: WorkforceCandidateDrawerProps) {
  const [candidates, setCandidates] = useState<WorkforceCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [maxDistance, setMaxDistance] = useState<number>(35);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!site) {
      setCandidates([]);
      setSelectedCandidateIds(new Set());
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fetchCandidates = async () => {
      try {
        const params = new URLSearchParams();
        params.set("targetSiteId", site.id);
        if (selectedPosition) params.set("position", selectedPosition);
        if (maxDistance) params.set("maxDistanceKm", maxDistance.toString());

        const res = await fetch(`/api/workforce-planning/candidates?${params.toString()}`);
        const data = await res.json();
        if (isMounted && data.success) {
          setCandidates(data.candidates || []);
        }
      } catch (err) {
        console.error("Failed to load candidates:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCandidates();

    return () => {
      isMounted = false;
    };
  }, [site, selectedPosition, maxDistance]);

  if (!site) return null;

  const toggleSelectCandidate = (candidate: WorkforceCandidate) => {
    const next = new Set(selectedCandidateIds);
    if (next.has(candidate.employeeId)) {
      next.delete(candidate.employeeId);
    } else {
      next.add(candidate.employeeId);
    }
    setSelectedCandidateIds(next);
  };

  const selectedCandidatesList = candidates.filter((c) =>
    selectedCandidateIds.has(c.employeeId)
  );

  const getAvailabilityBadge = (avail: string) => {
    switch (avail) {
      case "AVAILABLE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ✓ พร้อมปฏิบัติงาน
          </span>
        );
      case "LIMITED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ⚠️ ชั่วโมงสะสมจำกัด
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
            ✕ ไม่แนะนำ (ล้าสะสม)
          </span>
        );
    }
  };

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] lg:w-[500px] bg-slate-950 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold bg-brand-900/50 text-brand-300 px-2 py-0.5 rounded border border-brand-700/50">
              {site.code}
            </span>
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full",
                site.deficit > 0 ? "bg-rose-900/40 text-rose-300 border border-rose-700/40" : "bg-cyan-900/40 text-cyan-300"
              )}
            >
              {site.deficit > 0 ? `ขาดกำลังพล ${site.deficit} คน` : `กำลังพลเกิน +${site.surplus} คน`}
            </span>
          </div>
          <h2 className="text-base font-bold text-white">{site.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ระบบค้นหาพนักงานที่เหมาะสมจากไซต์ใกล้เคียงที่มีกำลังคนเกิน (Decision Support)
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filters (Position & Distance) */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/30 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
          <span>ตัวกรองการค้นหา</span>
          <span>ระยะทางสูงสุด: {maxDistance} กม.</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="กรองตามตำแหน่ง เช่น Operator..."
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-brand-500"
          />

          <select
            value={maxDistance}
            onChange={(e) => setMaxDistance(parseInt(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
          >
            <option value={15}>ภายใน 15 กม.</option>
            <option value={25}>ภายใน 25 กม.</option>
            <option value={35}>ภายใน 35 กม. (แนะนำ)</option>
            <option value={50}>ภายใน 50 กม.</option>
          </select>
        </div>
      </div>

      {/* Candidates List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <span className="text-xs">กำลังคำนวณและค้นหาพนักงานจากไซต์สำรอง...</span>
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-700" />
            <p className="text-xs font-bold text-slate-400">ไม่พบพนักงานจากไซต์ใกล้เคียงที่มีกำลังคนเกิน</p>
            <p className="text-[11px] text-slate-600">
              ลองขยายระยะทางค้นหา หรือตรวจสอบไซต์ที่มีสถานะ Overstaffed
            </p>
          </div>
        ) : (
          candidates.map((candidate) => {
            const isSelected = selectedCandidateIds.has(candidate.employeeId);

            return (
              <div
                key={candidate.employeeId}
                onClick={() => toggleSelectCandidate(candidate)}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative",
                  isSelected
                    ? "bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/30"
                    : candidate.isEligible
                    ? "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                    : "bg-slate-950/60 border-slate-800/60 opacity-60"
                )}
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectCandidate(candidate)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-700 bg-slate-950 cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-xs text-white">{candidate.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-1.5">({candidate.code})</span>
                      <div className="text-[11px] text-brand-300 font-medium">{candidate.position}</div>
                    </div>
                  </div>

                  {getAvailabilityBadge(candidate.availability)}
                </div>

                {/* Source Site & Distance info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ปัจจุบัน: <strong>{candidate.currentSiteName}</strong></span>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950 px-1.5 py-0.2 rounded">
                      เกิน +{candidate.currentSiteSurplus}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 font-mono text-amber-300">
                    <span>ห่าง {candidate.distanceKm} กม.</span>
                  </div>
                </div>

                {/* Explainable Reasons */}
                <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-[11px] space-y-1">
                  <span className="block font-bold text-slate-300 text-[10px]">
                    💡 เหตุผลประกอบการพิจารณา (Explainable Criteria):
                  </span>
                  {candidate.reasons.map((r, i) => (
                    <div key={i} className="text-slate-400 flex items-start gap-1.5 text-[10px] leading-tight">
                      <span className="text-brand-400">•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/90 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>เลือกพนักงาน: <strong>{selectedCandidatesList.length}</strong> คน</span>
          {site.deficit > 0 && (
            <span className="text-[11px] text-slate-400 font-mono">
              (ต้องการอีก {Math.max(0, site.deficit - selectedCandidatesList.length)} คน)
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onSimulate(selectedCandidatesList)}
            disabled={selectedCandidatesList.length === 0}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>จำลอง What-if</span>
          </button>

          <button
            onClick={() => onCreatePlan(selectedCandidatesList)}
            disabled={selectedCandidatesList.length === 0}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all disabled:opacity-40"
          >
            <span>สร้างแผนร่าง (Draft)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
