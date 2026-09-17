"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ScheduleKpiCards } from "@/components/schedule/ScheduleKpiCards";
import { ScheduleApprovalToolbar } from "@/components/schedule/ScheduleApprovalToolbar";
import { ScheduleTimelineMatrix } from "@/components/schedule/ScheduleTimelineMatrix";
import { UnassignedWorkerDrawer } from "@/components/schedule/UnassignedWorkerDrawer";
import { AutoScheduleModal } from "@/components/schedule/AutoScheduleModal";
import { Calendar, Users, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SchedulingCenterPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Date range defaults: This week
  const getInitialDates = () => {
    const today = new Date();
    const day = today.getDay();
    const diffToMon = (day + 6) % 7;
    const mon = new Date(today.getTime() - diffToMon * 86400000);
    const sun = new Date(mon.getTime() + 6 * 86400000);
    return {
      start: mon.toISOString().split("T")[0],
      end: sun.toISOString().split("T")[0],
    };
  };

  const initialDates = getInitialDates();
  const [startDate, setStartDate] = useState(initialDates.start);
  const [endDate, setEndDate] = useState(initialDates.end);
  const [selectedSiteId, setSelectedSiteId] = useState<string | undefined>(undefined);

  // Drawer state for assigning
  const [assignTarget, setAssignTarget] = useState<{
    isOpen: boolean;
    site?: { id: string; name: string };
    shift?: { id: string; name: string };
    date?: string;
  }>({ isOpen: false });

  // Auto-schedule modal state
  const [autoScheduleOpen, setAutoScheduleOpen] = useState(false);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(selectedSiteId ? { siteId: selectedSiteId } : {}),
      });
      const res = await fetch(`/api/schedule?${params.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch schedule:", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedSiteId]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Generate array of date strings between startDate and endDate
  const getDateRangeStrings = () => {
    const dates = [];
    const cur = new Date(startDate);
    const end = new Date(endDate);
    while (cur <= end) {
      dates.push(cur.toISOString().split("T")[0]);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return dates;
  };

  const dateStrings = getDateRangeStrings();

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="p-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-500" />
                ศูนย์จัดตารางกะอัจฉริยะ (Shift & Scheduling Intelligence)
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Phase 9
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              จัดสรรกำลังพลรายกะ ตรวจสอบความขัดแย้งเวลาพัก ควบคุมค่าล่วงเวลา และเชื่อมโยงกับการลงเวลาจริง
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/operations/shifts"
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              แดชบอร์ดติดตามกะสด (Shifts)
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/my-schedule"
              className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              มุมมองพนักงาน (My Schedule)
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-6 max-w-[1700px] w-full mx-auto space-y-6">
          {loading && !data ? (
            <div className="h-96 flex flex-col items-center justify-center text-zinc-500 space-y-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">กำลังโหลดตารางการจัดกะและวิเคราะห์อัตรากำลัง...</p>
            </div>
          ) : data ? (
            <>
              {/* KPI Summary Cards */}
              <ScheduleKpiCards summary={data.summary} />

              {/* Approval & Action Toolbar */}
              <ScheduleApprovalToolbar
                currentStatus={data.summary.periodStatus}
                version={data.summary.version}
                startDate={startDate}
                endDate={endDate}
                selectedSiteId={selectedSiteId}
                sites={data.sites}
                onDateChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
                onSiteChange={(sId) => setSelectedSiteId(sId)}
                onOpenAutoSchedule={() => setAutoScheduleOpen(true)}
                onRefresh={fetchSchedule}
              />

              {/* Matrix Scheduler Grid */}
              <ScheduleTimelineMatrix
                coverages={data.coverages}
                dates={dateStrings}
                shifts={data.shifts}
                sites={selectedSiteId ? data.sites.filter((s: any) => s.id === selectedSiteId) : data.sites}
                onOpenAssign={(site, shift, date) => {
                  setAssignTarget({ isOpen: true, site, shift, date });
                }}
                onRefresh={fetchSchedule}
              />
            </>
          ) : null}
        </div>

        {/* Drawer for Assigning Worker */}
        <UnassignedWorkerDrawer
          isOpen={assignTarget.isOpen}
          onClose={() => setAssignTarget({ isOpen: false })}
          workers={data?.unassignedEmployees || []}
          targetSite={assignTarget.site}
          targetShift={assignTarget.shift}
          targetDate={assignTarget.date}
          onAssigned={() => {
            fetchSchedule();
            setAssignTarget({ isOpen: false });
          }}
        />

        {/* Auto Schedule Modal */}
        <AutoScheduleModal
          isOpen={autoScheduleOpen}
          onClose={() => setAutoScheduleOpen(false)}
          startDate={startDate}
          endDate={endDate}
          onGenerated={fetchSchedule}
        />
      </main>
    </div>
  );
}
