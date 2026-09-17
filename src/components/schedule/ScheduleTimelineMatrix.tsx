"use client";

import React from "react";
import {
  User,
  Plus,
  Trash2,
  Shield,
  Clock,
  AlertCircle,
  Building2,
  Calendar,
} from "lucide-react";
import Swal from "sweetalert2";

interface ShiftCoverage {
  siteId: string;
  siteName: string;
  siteCode: string;
  shiftId: string;
  shiftName: string;
  shiftCode: string;
  shiftColor: string;
  workDate: string;
  required: number;
  scheduled: number;
  gap: number;
  status: "UNDERSTAFFED" | "BALANCED" | "OVERSTAFFED" | "CRITICAL";
  supervisorCoverage: "COVERED" | "MISSING";
  hasSupervisor: boolean;
  assignedEmployees: Array<{
    id: string;
    assignmentId: string;
    employeeId: string;
    name: string;
    code: string;
    position: string;
    isSupervisor: boolean;
    status: string;
    plannedStart: string;
    plannedEnd: string;
  }>;
}

interface ScheduleTimelineMatrixProps {
  coverages: ShiftCoverage[];
  dates: string[];
  shifts: Array<{ id: string; code: string; name: string; color: string; startTime: string; endTime: string }>;
  sites: Array<{ id: string; code: string; name: string }>;
  onOpenAssign: (site: { id: string; name: string }, shift: { id: string; name: string }, date: string) => void;
  onRefresh: () => void;
}

export function ScheduleTimelineMatrix({
  coverages,
  dates,
  shifts,
  sites,
  onOpenAssign,
  onRefresh,
}: ScheduleTimelineMatrixProps) {
  const handleDeleteAssignment = async (assignmentId: string, empName: string) => {
    const confirm = await Swal.fire({
      title: "ยืนยันการลบการจัดกะ?",
      text: `ต้องการยกเลิกการจัดกะของ ${empName} ใช่หรือไม่`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#3F3F46",
      confirmButtonText: "ลบรายการ",
      cancelButtonText: "ยกเลิก",
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`/api/schedule/assignments/${assignmentId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error);
        }
        Swal.fire({
          icon: "success",
          title: "ลบสำเร็จ",
          timer: 1000,
          showConfirmButton: false,
        });
        onRefresh();
      } catch (err: any) {
        Swal.fire({ icon: "error", title: "ล้มเหลว", text: err.message });
      }
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "CRITICAL":
        return "border-rose-500/50 bg-rose-950/20 text-rose-400";
      case "UNDERSTAFFED":
        return "border-amber-500/50 bg-amber-950/20 text-amber-400";
      case "OVERSTAFFED":
        return "border-blue-500/50 bg-blue-950/20 text-blue-400";
      default:
        return "border-emerald-500/50 bg-emerald-950/20 text-emerald-400";
    }
  };

  return (
    <div className="space-y-6">
      {sites.map((site) => (
        <div
          key={site.id}
          className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl"
        >
          {/* Site Header */}
          <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {site.name}
                  <span className="text-xs text-zinc-500 font-mono font-normal">({site.code})</span>
                </h3>
              </div>
            </div>
          </div>

          {/* Table Matrix for Desktop / Tablet */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/30 text-xs font-semibold text-zinc-400">
                  <th className="p-3 w-40">กะการทำงาน</th>
                  {dates.map((d) => (
                    <th key={d} className="p-3 text-center border-l border-zinc-800/60">
                      <div className="text-white font-medium">{d}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-zinc-900/20 transition">
                    {/* Shift Label */}
                    <td className="p-3 align-top">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: shift.color }}
                        />
                        {shift.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </td>

                    {/* Day Cells */}
                    {dates.map((dateStr) => {
                      const coverage = coverages.find(
                        (c) =>
                          c.siteId === site.id &&
                          c.shiftId === shift.id &&
                          c.workDate === dateStr
                      );

                      if (!coverage) {
                        return (
                          <td key={dateStr} className="p-2 border-l border-zinc-800/60 align-top">
                            <div className="h-full min-h-[90px] rounded-lg border border-dashed border-zinc-800 flex items-center justify-center text-zinc-600 text-[11px]">
                              -
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={dateStr}
                          className="p-2 border-l border-zinc-800/60 align-top"
                        >
                          <div
                            className={`rounded-xl p-2 border flex flex-col justify-between min-h-[110px] transition ${getStatusClass(
                              coverage.status
                            )}`}
                          >
                            {/* Coverage Header */}
                            <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/50 mb-1.5">
                              <span className="text-[10px] font-bold">
                                จัด {coverage.scheduled}/{coverage.required} คน
                              </span>
                              {coverage.hasSupervisor ? (
                                <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
                                  <Shield className="w-2.5 h-2.5" /> Sup
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-[9px] font-semibold text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20">
                                  <AlertCircle className="w-2.5 h-2.5" /> No Sup
                                </span>
                              )}
                            </div>

                            {/* Assigned Employees Chips */}
                            <div className="space-y-1 flex-1">
                              {coverage.assignedEmployees.map((emp) => (
                                <div
                                  key={emp.assignmentId}
                                  className="group flex items-center justify-between bg-zinc-900 border border-zinc-700/60 rounded px-1.5 py-1 text-white text-[11px] hover:border-zinc-500 transition"
                                >
                                  <div className="flex items-center gap-1 truncate">
                                    {emp.isSupervisor && (
                                      <Shield className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                                    )}
                                    <span className="truncate">{emp.name}</span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleDeleteAssignment(emp.assignmentId, emp.name)
                                    }
                                    className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-400 transition ml-1"
                                    title="ยกเลิกการจัดกะ"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Add Button */}
                            <button
                              onClick={() => onOpenAssign(site, shift, dateStr)}
                              className="mt-2 w-full py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center gap-1 text-[10px] font-medium transition"
                            >
                              <Plus className="w-3 h-3" />
                              จัดคนเพิ่ม
                            </button>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
