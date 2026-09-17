"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Repeat,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Building,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function MySchedulePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [targetAssignmentId, setTargetAssignmentId] = useState("");
  const [swapReason, setSwapReason] = useState("");
  const [colleagueAssignments, setColleagueAssignments] = useState<any[]>([]);

  const fetchMySchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/schedule");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySchedule();
  }, []);

  const handleConfirmShift = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/me/schedule/${assignmentId}/confirm`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to confirm");
      Swal.fire({
        icon: "success",
        title: "ยืนยันรับทราบกะสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });
      fetchMySchedule();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    }
  };

  const openSwapModal = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setSwapModalOpen(true);
    try {
      // Fetch active employees for swap candidates
      const res = await fetch("/api/workforce-planning/overview");
      const json = await res.json();
      if (res.ok && json.sites) {
        // Flat list
        const emps: any[] = [];
        json.sites.forEach((s: any) => {
          if (s.employees) {
            s.employees.forEach((e: any) => {
              if (e.id !== data?.employeeId) {
                emps.push(e);
              }
            });
          }
        });
        setAllEmployees(emps);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // When colleague is selected, fetch their shifts
  const handleSelectColleague = async (colleagueId: string) => {
    setTargetEmployeeId(colleagueId);
    try {
      const res = await fetch(`/api/schedule?employeeId=${colleagueId}`);
      const json = await res.json();
      if (res.ok && json.coverages) {
        const shifts: any[] = [];
        json.coverages.forEach((c: any) => {
          c.assignedEmployees.forEach((emp: any) => {
            if (emp.employeeId === colleagueId) {
              shifts.push({
                assignmentId: emp.assignmentId,
                siteName: c.siteName,
                shiftName: c.shiftName,
                workDate: c.workDate,
              });
            }
          });
        });
        setColleagueAssignments(shifts);
        if (shifts.length > 0) {
          setTargetAssignmentId(shifts[0].assignmentId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitSwap = async () => {
    if (!targetEmployeeId || !targetAssignmentId || !selectedAssignment) {
      Swal.fire({ icon: "warning", title: "กรุณาเลือกเพื่อนร่วมงานและกะที่ต้องการสลับ" });
      return;
    }

    try {
      const res = await fetch("/api/shift-swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterAssignmentId: selectedAssignment.id,
          targetEmployeeId,
          targetAssignmentId,
          reason: swapReason,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit swap");
      }

      Swal.fire({
        icon: "success",
        title: "ส่งคำขอสลับกะสำเร็จ",
        text: "คำขอจะถูกส่งให้เพื่อนร่วมงานและหัวหน้างานพิจารณาตามลำดับ",
      });

      setSwapModalOpen(false);
      fetchMySchedule();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ไม่สามารถขอสลับกะได้", text: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/operations/schedule"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับสู่ศูนย์ควบคุม
          </Link>
          <span className="text-xs text-zinc-500 font-mono">My Schedule Portal</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-blue-500" />
            ตารางกะทำงานของฉัน
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            ตรวจสอบกำหนดการเข้างาน ยืนยันกะ และส่งคำขอสลับกะกับเพื่อนร่วมงาน
          </p>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-zinc-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
            กำลังโหลดตารางงาน...
          </div>
        ) : (
          <>
            {/* Upcoming Hero Card */}
            {data?.nextShift ? (
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900/40 via-zinc-900 to-zinc-950 border border-blue-500/30 p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    กะการทำงานถัดไป (Next Shift)
                  </span>

                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      data.nextShift.status === "CONFIRMED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {data.nextShift.status === "CONFIRMED" ? "ยืนยันแล้ว" : "รอยืนยัน"}
                  </span>
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white">
                    {data.nextShift.shift.name}
                  </h2>
                  <div className="text-sm text-zinc-300 flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-blue-400" />
                    {data.nextShift.shift.startTime} - {data.nextShift.shift.endTime} น.
                    {data.nextShift.shift.isOvernight && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                        กะข้ามวัน
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400 bg-black/40 rounded-xl p-3 border border-zinc-800">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-white">
                      {data.nextShift.site.name}
                    </span>{" "}
                    ({data.nextShift.site.code})
                    <p className="text-[11px] text-zinc-500">
                      {data.nextShift.site.location || "ประจำไซต์งานหลัก"}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  {data.nextShift.status !== "CONFIRMED" ? (
                    <button
                      onClick={() => handleConfirmShift(data.nextShift.id)}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
                    >
                      <CheckCircle className="w-4 h-4" />
                      กดยืนยันรับทราบกะนี้
                    </button>
                  ) : (
                    <div className="flex-1 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle className="w-4 h-4" />
                      คุณยืนยันรับทราบกะนี้แล้ว
                    </div>
                  )}

                  <button
                    onClick={() => openSwapModal(data.nextShift)}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Repeat className="w-4 h-4" />
                    ขอสลับกะ
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm font-medium text-zinc-300">ยังไม่มีกะการทำงานถัดไป</p>
                <p className="text-xs">เมื่อผู้บริหารเผยแพร่ตารางงาน กะของคุณจะปรากฏที่นี่</p>
              </div>
            )}

            {/* Upcoming Shifts List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                รายการกะทั้งหมด ({data?.assignments?.length || 0})
              </h3>

              <div className="space-y-2">
                {data?.assignments?.map((a: any) => (
                  <div
                    key={a.id}
                    className="bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 flex items-center justify-between transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">
                          {a.workDate.split("T")[0]}
                        </span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: a.shift.color || "#3B82F6" }}
                        />
                        <span className="text-sm font-semibold text-white">
                          {a.shift.name}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {a.shift.startTime} - {a.shift.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3 text-zinc-500" />
                          {a.site.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openSwapModal(a)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium flex items-center gap-1 transition"
                      >
                        <Repeat className="w-3.5 h-3.5 text-zinc-400" />
                        สลับ
                      </button>

                      {a.status !== "CONFIRMED" ? (
                        <button
                          onClick={() => handleConfirmShift(a.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          ยืนยัน
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20 font-medium">
                          ยืนยันแล้ว
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Swap Modal */}
        {swapModalOpen && selectedAssignment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-blue-400" />
                  ยื่นคำขอสลับกะ (Shift Swap)
                </h3>
                <button
                  onClick={() => setSwapModalOpen(false)}
                  className="text-zinc-500 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 space-y-1">
                <div>
                  <strong>กะของคุณ:</strong> {selectedAssignment.shift.name} (
                  {selectedAssignment.workDate.split("T")[0]})
                </div>
                <div className="text-zinc-400">ไซต์: {selectedAssignment.site.name}</div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1">เลือกเพื่อนร่วมงานที่ต้องการสลับ:</label>
                  <select
                    value={targetEmployeeId}
                    onChange={(e) => handleSelectColleague(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- เลือกเพื่อนร่วมงาน --</option>
                    {allEmployees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.position})
                      </option>
                    ))}
                  </select>
                </div>

                {colleagueAssignments.length > 0 && (
                  <div>
                    <label className="block text-zinc-400 mb-1">เลือกกะของเพื่อนร่วมงานที่จะแลก:</label>
                    <select
                      value={targetAssignmentId}
                      onChange={(e) => setTargetAssignmentId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      {colleagueAssignments.map((ca) => (
                        <option key={ca.assignmentId} value={ca.assignmentId}>
                          {ca.workDate} • {ca.shiftName} ({ca.siteName})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-zinc-400 mb-1">เหตุผลความจำเป็นในการขอสลับ:</label>
                  <textarea
                    rows={2}
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                    placeholder="เช่น ติดธุระครอบครัว หรือสลับเพื่อเข้าเวรแทน..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setSwapModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmitSwap}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  ส่งคำขอสลับกะ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
