"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Building,
  Calendar,
  Filter,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

export default function ShiftsOperationsPage() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [otForecast, setOtForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, otRes] = await Promise.all([
        fetch(`/api/attendance/reconciliation?date=${selectedDate}`),
        fetch(`/api/operations/ot-forecast?startDate=${selectedDate}`),
      ]);

      const [recData, otData] = await Promise.all([recRes.json(), otRes.json()]);
      setReconciliation(recData);
      setOtForecast(otData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const filteredRecords = reconciliation?.records?.filter((r: any) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ON_TIME":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          text: "ตรงเวลา (On Time)",
        };
      case "LATE":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          text: "เข้างานสาย (Late)",
        };
      case "EARLY_LEAVE":
        return {
          bg: "bg-orange-500/10 text-orange-400 border-orange-500/20",
          text: "ออกก่อนเวลา (Early Leave)",
        };
      case "ABSENT":
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/20",
          text: "ขาดงาน (Absent)",
        };
      case "INCOMPLETE":
        return {
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          text: "ไม่สแกนออก (Incomplete)",
        };
      case "OVERTIME":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          text: "ล่วงเวลา (Overtime)",
        };
      default:
        return {
          bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
          text: "วันหยุด (Rest Day)",
        };
    }
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="p-6 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-6 h-6 text-emerald-400" />
              แดชบอร์ดติดตามกะสดและการลงเวลา (Shifts Operations & Reconciliation)
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              เปรียบเทียบตารางกะที่วางแผนไว้ (Planned Shift) กับการลงเวลาทำงานจริง (Actual Attendance)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
              <Calendar className="w-4 h-4 text-blue-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none"
              />
            </div>

            <Link
              href="/admin/operations/schedule"
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-blue-500/20"
            >
              ไปที่ศูนย์จัดตาราง (Scheduler)
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        <div className="p-6 max-w-[1700px] w-full mx-auto space-y-6">
          {/* Summary KPIs */}
          {reconciliation?.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-xs text-zinc-400">พนักงานในแผน</span>
                <span className="text-2xl font-bold text-white">
                  {reconciliation.summary.total}
                </span>
                <span className="text-[11px] text-zinc-500">คนทั้งหมด</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-xs text-zinc-400">มาตรงเวลา</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {reconciliation.summary.onTime}
                </span>
                <span className="text-[11px] text-emerald-400/70">สแกนตามกำหนด</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-xs text-zinc-400">มาสาย</span>
                <span className="text-2xl font-bold text-amber-400">
                  {reconciliation.summary.late}
                </span>
                <span className="text-[11px] text-zinc-500">
                  รวม {reconciliation.summary.totalLateMinutes} นาที
                </span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-xs text-zinc-400">ออกก่อนเวลา</span>
                <span className="text-2xl font-bold text-orange-400">
                  {reconciliation.summary.earlyLeave}
                </span>
                <span className="text-[11px] text-zinc-500">ก่อนสิ้นสุดกะ</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-xs text-zinc-400">ขาดงาน (Absent)</span>
                <span className="text-2xl font-bold text-rose-400">
                  {reconciliation.summary.absent}
                </span>
                <span className="text-[11px] text-rose-400/70">ไม่พบการลงเวลา</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-xs text-zinc-400">สแกนไม่ครบ</span>
                <span className="text-2xl font-bold text-purple-400">
                  {reconciliation.summary.incomplete}
                </span>
                <span className="text-[11px] text-zinc-500">ไม่สแกนออก</span>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
                <span className="text-xs text-zinc-400">ชั่วโมงคิดค่าจ้าง</span>
                <span className="text-2xl font-bold text-blue-400">
                  {reconciliation.summary.totalPayableHours}
                </span>
                <span className="text-[11px] text-zinc-500">ชั่วโมงทำงานสุทธิ</span>
              </div>
            </div>
          )}

          {/* OT Forecast Panel */}
          {otForecast && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  <h2 className="text-sm font-bold text-white">
                    ประมาณการค่าล่วงเวลาประจำสัปดาห์ (Predictive OT Forecast)
                  </h2>
                </div>
                <div className="text-xs text-zinc-400">
                  รวมประมาณการ OT:{" "}
                  <span className="text-orange-400 font-bold text-sm">
                    {otForecast.totalProjectedOtHours} ชม.
                  </span>
                  {otForecast.highRiskSitesCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                      เสี่ยงสูง {otForecast.highRiskSitesCount} ไซต์
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {otForecast.sites?.slice(0, 6).map((site: any) => (
                  <div
                    key={site.siteId}
                    className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {site.siteName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          site.riskLevel === "HIGH"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : site.riskLevel === "MEDIUM"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}
                      >
                        ความเสี่ยง {site.riskLevel}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center justify-between">
                      <span>จัดแล้ว {site.scheduledShifts} กะ</span>
                      <span className="text-orange-400 font-semibold">
                        OT ~{site.projectedOtHours} ชม.
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">{site.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reconciliation Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl space-y-3">
            <div className="p-4 bg-zinc-900/40 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">
                  ตารางเปรียบเทียบการลงเวลาจริงกับกะ (Planned vs Actual Reconciliation)
                </h3>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                {["ALL", "ON_TIME", "LATE", "EARLY_LEAVE", "ABSENT", "INCOMPLETE"].map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        statusFilter === st
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-900 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {st === "ALL" ? "ทั้งหมด" : st}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-semibold">
                    <th className="p-3">พนักงาน</th>
                    <th className="p-3">ไซต์งาน</th>
                    <th className="p-3">กะการทำงาน</th>
                    <th className="p-3">เวลาตามกะ (Planned)</th>
                    <th className="p-3">สแกนจริง (Actual)</th>
                    <th className="p-3">เวลาเริ่มคิดค่าจ้าง (Payable)</th>
                    <th className="p-3">ชั่วโมงทำงาน</th>
                    <th className="p-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredRecords?.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-zinc-500">
                        ไม่พบข้อมูลการลงเวลาในเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredRecords?.map((rec: any, i: number) => {
                      const badge = getStatusBadge(rec.status);
                      const formatTime = (iso: string | null) =>
                        iso ? iso.split("T")[1].slice(0, 5) : "-";

                      return (
                        <tr key={i} className="hover:bg-zinc-900/30 transition">
                          <td className="p-3">
                            <div className="font-semibold text-white">
                              {rec.employeeName}
                            </div>
                            <div className="text-zinc-500 font-mono text-[11px]">
                              {rec.employeeCode}
                            </div>
                          </td>
                          <td className="p-3 text-zinc-300">{rec.siteName}</td>
                          <td className="p-3 text-zinc-300 font-medium">
                            {rec.shiftName || "ไม่ได้วางกะ"}
                          </td>
                          <td className="p-3 text-zinc-400 font-mono">
                            {formatTime(rec.scheduledStart)} - {formatTime(rec.scheduledEnd)}
                          </td>
                          <td className="p-3 text-white font-mono">
                            {formatTime(rec.actualCheckIn)} - {formatTime(rec.actualCheckOut)}
                          </td>
                          <td className="p-3 text-zinc-400 font-mono">
                            {formatTime(rec.payableWorkStart)} -{" "}
                            {formatTime(rec.payableWorkEnd)}
                          </td>
                          <td className="p-3 text-white font-semibold">
                            {(rec.payableWorkingMinutes / 60).toFixed(1)} ชม.
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg}`}
                            >
                              {badge.text}
                            </span>
                            {rec.lateMinutes > 0 && (
                              <div className="text-[10px] text-amber-400 mt-0.5">
                                สาย {rec.lateMinutes} นาที
                              </div>
                            )}
                            {rec.earlyLeaveMinutes > 0 && (
                              <div className="text-[10px] text-orange-400 mt-0.5">
                                ออกก่อน {rec.earlyLeaveMinutes} นาที
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
