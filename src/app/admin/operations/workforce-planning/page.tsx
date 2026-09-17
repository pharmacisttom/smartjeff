"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Users,
  Building2,
  RefreshCw,
  AlertTriangle,
  Radio,
  Clock,
  ArrowRight,
  ShieldAlert,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { TimeModeSwitcher } from "@/components/workforce-planning/TimeModeSwitcher";
import { WorkforcePlanningKpiCards } from "@/components/workforce-planning/WorkforcePlanningKpiCards";
import { SiteStaffingTable } from "@/components/workforce-planning/SiteStaffingTable";
import { PositionGapList } from "@/components/workforce-planning/PositionGapList";
import { WorkforceCandidateDrawer } from "@/components/workforce-planning/WorkforceCandidateDrawer";
import { WhatIfSimulationModal } from "@/components/workforce-planning/WhatIfSimulationModal";
import { DraftPlanModal } from "@/components/workforce-planning/DraftPlanModal";
import type {
  SiteStaffingSummary,
  WorkforceCandidate,
  SimulationResult,
} from "@/server/services/workforce-planning.service";

// Dynamic import Leaflet map with ssr: false
const WorkforceGapMap = dynamic(
  () =>
    import("@/components/workforce-planning/WorkforceGapMap").then(
      (mod) => mod.WorkforceGapMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[480px] md:h-[580px] rounded-3xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">กำลังโหลดแผนผังกำลังพลและเส้นทางจัดสรร...</span>
      </div>
    ),
  }
);

export default function WorkforcePlanningPage() {
  const [timeMode, setTimeMode] = useState<"today" | "tomorrow" | "custom">("today");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSite, setSelectedSite] = useState<SiteStaffingSummary | null>(null);

  // Modal states
  const [isCandidateDrawerOpen, setIsCandidateDrawerOpen] = useState(false);
  const [simulationData, setSimulationData] = useState<SimulationResult | null>(null);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [isDraftPlanOpen, setIsDraftPlanOpen] = useState(false);
  const [selectedCandidatesForPlan, setSelectedCandidatesForPlan] = useState<WorkforceCandidate[]>([]);

  // Fetch planning data
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["workforce-planning", timeMode, selectedDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("mode", timeMode);
      if (selectedDate && timeMode === "custom") {
        params.set("date", selectedDate);
      }

      const res = await fetch(`/api/workforce-planning/overview?${params.toString()}`);
      if (!res.ok) {
        throw new Error("ไม่สามารถเชื่อมต่อระบบ Workforce Planning ได้");
      }
      return res.json();
    },
    staleTime: 10000,
  });

  const handleSimulate = async (candidates: WorkforceCandidate[]) => {
    if (!selectedSite || candidates.length === 0) return;

    try {
      const res = await fetch("/api/workforce-planning/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetSiteId: selectedSite.id,
          sourceSiteId: candidates[0].currentSiteId,
          employeeIds: candidates.map((c) => c.employeeId),
          dateStr: data?.date,
        }),
      });
      const json = await res.json();
      if (json.success && json.simulation) {
        setSimulationData(json.simulation);
        setIsSimulationOpen(true);
        setSelectedCandidatesForPlan(candidates);
      }
    } catch (err) {
      console.error("Simulation error:", err);
    }
  };

  const handleCreatePlan = (candidates: WorkforceCandidate[]) => {
    setSelectedCandidatesForPlan(candidates);
    setIsDraftPlanOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8 space-y-6 font-sans pb-24">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-widest">
            <Link
              href="/admin/operations/live-map"
              className="hover:text-white flex items-center gap-1 transition-colors text-slate-400"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่ Live Map</span>
            </Link>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Smart Workforce Planning & Optimization</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ระบบวิเคราะห์และวางแผนกำลังคนหน้างาน (Workforce DSS)
          </h1>

          <p className="text-xs text-slate-300 max-w-3xl">
            ช่วยผู้บริหารวิเคราะห์จุดขาด-เกินกำลังพลหน้างาน (Gap Analysis) ตรวจจับความเหนื่อยล้าสะสม (Fatigue Guard)
            และจำลองการเกลี่ยกำลังคนจากไซต์ใกล้เคียงเพื่อสนับสนุนการตัดสินใจ
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin")} />
            <span>คำนวณใหม่</span>
          </button>
        </div>
      </div>

      {/* Time Mode Switcher */}
      <TimeModeSwitcher
        mode={timeMode}
        onModeChange={(m) => setTimeMode(m)}
        selectedDate={selectedDate}
        onDateChange={(d) => setSelectedDate(d)}
      />

      {/* KPI Cards */}
      {data?.summary && <WorkforcePlanningKpiCards summary={data.summary} />}

      {/* Main Content Layout: Map & Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Map (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <WorkforceGapMap
            sites={data?.sites || []}
            selectedSite={selectedSite}
            onSelectSite={(s) => setSelectedSite(s)}
          />
        </div>

        {/* Right Side: Site Planning Focus Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedSite ? (
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
              {/* Site Card Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold bg-brand-900/50 text-brand-300 px-2 py-0.5 rounded">
                      {selectedSite.code}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        selectedSite.gap < 0
                          ? "bg-rose-900/40 text-rose-300 border border-rose-700/40"
                          : selectedSite.gap > 0
                          ? "bg-cyan-900/40 text-cyan-300"
                          : "bg-emerald-900/40 text-emerald-300"
                      )}
                    >
                      {selectedSite.gap < 0
                        ? `ขาดคน ${selectedSite.deficit} คน`
                        : selectedSite.gap > 0
                        ? `คนเกิน +${selectedSite.surplus} คน`
                        : "ครบตามเป้า"}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-base">{selectedSite.name}</h3>
                  <p className="text-[11px] text-slate-400">{selectedSite.location || "นิคมอุตสาหกรรม"}</p>
                </div>

                <button
                  onClick={() => setSelectedSite(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Staffing Capacity Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">ขั้นต่ำ (Min)</span>
                  <span className="font-bold text-slate-300 text-sm">{selectedSite.minimum}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">เป้าหมาย (Target)</span>
                  <span className="font-bold text-white text-sm">{selectedSite.target}</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block">ทำงานจริง</span>
                  <span className="font-bold text-emerald-400 text-sm">{selectedSite.working}</span>
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold text-[11px]">การประเมินความเสี่ยง:</span>
                  <span
                    className={cn(
                      "font-bold text-[10px] px-2 py-0.5 rounded-full font-mono",
                      selectedSite.riskLevel === "CRITICAL"
                        ? "bg-rose-900/60 text-rose-300"
                        : selectedSite.riskLevel === "HIGH"
                        ? "bg-amber-900/60 text-amber-300"
                        : "bg-emerald-900/60 text-emerald-300"
                    )}
                  >
                    {selectedSite.riskLevel}
                  </span>
                </div>
                {selectedSite.riskReasons.map((r, i) => (
                  <div key={i} className="text-slate-400 text-[10px] flex items-start gap-1">
                    <span className="text-amber-400">•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {/* Position Gap Breakdown */}
              <PositionGapList
                positionGaps={selectedSite.positionGaps}
                siteName={selectedSite.name}
              />

              {/* Nearby Available Capacity */}
              {selectedSite.deficit > 0 && (
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                    <span className="text-cyan-300 font-bold">ไซต์สำรองใกล้เคียงที่มีคนเกิน:</span>
                    <span>{selectedSite.nearbySurplusSites.length} ไซต์</span>
                  </div>

                  {selectedSite.nearbySurplusSites.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">
                      ไม่พบไซต์ใกล้เคียงที่มีกำลังคนเกินในระยะ 60 กม.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {selectedSite.nearbySurplusSites.map((nb) => (
                        <div
                          key={nb.siteId}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                        >
                          <div>
                            <div className="font-bold text-white text-[11px]">{nb.siteName}</div>
                            <div className="text-[10px] text-slate-400">ห่าง {nb.distanceKm} กม.</div>
                          </div>
                          <span className="font-mono font-bold text-cyan-300 text-xs bg-cyan-950 px-2 py-0.5 rounded">
                            เกิน +{nb.surplus} คน
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setIsCandidateDrawerOpen(true)}
                    className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-brand-600 hover:from-cyan-500 hover:to-brand-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95"
                  >
                    <span>ค้นหาพนักงานที่แนะนำ (Find Candidates)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-700 mx-auto" />
              <h4 className="font-bold text-sm text-slate-300">เลือกไซต์งานบนแผนที่หรือในตาราง</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                คลิกที่หมุดไซต์งานเพื่อดูรายละเอียดการวิเคราะห์ช่องว่างรายตำแหน่ง (Position Gap), ความเสี่ยงกำลังพล,
                และค้นหาพนักงานจากไซต์สำรองใกล้เคียง
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Full Width Staffing Table */}
      <SiteStaffingTable
        sites={data?.sites || []}
        selectedSite={selectedSite}
        onSelectSite={(s) => setSelectedSite(s)}
      />

      {/* Candidate Recommendation Drawer */}
      <WorkforceCandidateDrawer
        site={isCandidateDrawerOpen ? selectedSite : null}
        onClose={() => setIsCandidateDrawerOpen(false)}
        onSimulate={handleSimulate}
        onCreatePlan={handleCreatePlan}
      />

      {/* What-if Simulation Modal */}
      <WhatIfSimulationModal
        isOpen={isSimulationOpen}
        simulation={simulationData}
        onClose={() => setIsSimulationOpen(false)}
        onProceedToDraft={() => {
          setIsSimulationOpen(false);
          setIsDraftPlanOpen(true);
        }}
      />

      {/* Draft Plan Modal */}
      <DraftPlanModal
        isOpen={isDraftPlanOpen}
        targetSite={selectedSite}
        candidates={selectedCandidatesForPlan}
        onClose={() => setIsDraftPlanOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
