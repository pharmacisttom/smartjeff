"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  CheckCircle,
  Share2,
  Lock,
  Unlock,
  Calendar,
  Building,
  RotateCw,
} from "lucide-react";
import Swal from "sweetalert2";

interface ScheduleApprovalToolbarProps {
  currentStatus: string;
  version: number;
  startDate: string;
  endDate: string;
  selectedSiteId?: string;
  sites: Array<{ id: string; name: string; code: string }>;
  onDateChange: (start: string, end: string) => void;
  onSiteChange: (siteId: string | undefined) => void;
  onOpenAutoSchedule: () => void;
  onRefresh: () => void;
}

export function ScheduleApprovalToolbar({
  currentStatus,
  version,
  startDate,
  endDate,
  selectedSiteId,
  sites,
  onDateChange,
  onSiteChange,
  onOpenAutoSchedule,
  onRefresh,
}: ScheduleApprovalToolbarProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (action: "REVIEW" | "APPROVE" | "PUBLISH" | "LOCK" | "UNLOCK") => {
    let reason = "";

    if (action === "LOCK") {
      const { value: inputReason } = await Swal.fire({
        title: "ระบุเหตุผลการล็อคตาราง",
        input: "text",
        inputPlaceholder: "เช่น ผ่านการตรวจสอบและยืนยันรอบสุดท้ายแล้ว",
        showCancelButton: true,
        confirmButtonText: "ยืนยันการล็อค",
        cancelButtonText: "ยกเลิก",
      });
      if (inputReason === undefined) return;
      reason = inputReason;
    } else if (action === "PUBLISH") {
      const confirm = await Swal.fire({
        title: "ยืนยันการเผยแพร่ตารางกะ?",
        text: "เมื่อเผยแพร่แล้ว พนักงานจะสามารถเห็นตารางในหน้า 'ตารางงานของฉัน' ได้ทันที",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "เผยแพร่ตาราง",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#10B981",
      });
      if (!confirm.isConfirmed) return;
    }

    setLoadingAction(action);
    try {
      const res = await fetch("/api/schedule/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          siteId: selectedSiteId,
          action,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Swal.fire({
        icon: "success",
        title: "ดำเนินการสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });
      onRefresh();
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err.message });
    } finally {
      setLoadingAction(null);
    }
  };

  // Quick Date Helpers
  const setQuickRange = (type: "TOMORROW" | "THIS_WEEK" | "NEXT_WEEK") => {
    const today = new Date();
    if (type === "TOMORROW") {
      const tomorrow = new Date(today.getTime() + 86400000);
      const iso = tomorrow.toISOString().split("T")[0];
      onDateChange(iso, iso);
    } else if (type === "THIS_WEEK") {
      const day = today.getDay();
      const diffToMon = (day + 6) % 7;
      const mon = new Date(today.getTime() - diffToMon * 86400000);
      const sun = new Date(mon.getTime() + 6 * 86400000);
      onDateChange(mon.toISOString().split("T")[0], sun.toISOString().split("T")[0]);
    } else if (type === "NEXT_WEEK") {
      const day = today.getDay();
      const diffToMon = (day + 6) % 7;
      const nextMon = new Date(today.getTime() + (7 - diffToMon) * 86400000);
      const nextSun = new Date(nextMon.getTime() + 6 * 86400000);
      onDateChange(nextMon.toISOString().split("T")[0], nextSun.toISOString().split("T")[0]);
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
      {/* Left: Date Presets & Site Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          <button
            onClick={() => setQuickRange("TOMORROW")}
            className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            พรุ่งนี้
          </button>
          <button
            onClick={() => setQuickRange("THIS_WEEK")}
            className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            สัปดาห์นี้
          </button>
          <button
            onClick={() => setQuickRange("NEXT_WEEK")}
            className="px-3 py-1 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
          >
            สัปดาห์หน้า
          </button>
        </div>

        {/* Custom Date Inputs */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onDateChange(e.target.value, endDate)}
            className="bg-transparent text-white focus:outline-none"
          />
          <span>ถึง</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onDateChange(startDate, e.target.value)}
            className="bg-transparent text-white focus:outline-none"
          />
        </div>

        {/* Site Filter */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-400">
          <Building className="w-3.5 h-3.5 text-amber-400" />
          <select
            value={selectedSiteId || ""}
            onChange={(e) => onSiteChange(e.target.value ? e.target.value : undefined)}
            className="bg-transparent text-white focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-zinc-900 text-white">
              ทุกไซต์งาน (All Sites)
            </option>
            {sites.map((s) => (
              <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
          title="รีเฟรชข้อมูล"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Actions & Workflow */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Auto Schedule Button */}
        <button
          onClick={onOpenAutoSchedule}
          className="px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
          ผู้ช่วยจัดอัตโนมัติ
        </button>

        {/* Workflow Action Buttons */}
        {currentStatus === "DRAFT" && (
          <button
            onClick={() => handleAction("REVIEW")}
            disabled={loadingAction === "REVIEW"}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" />
            เสนอตรวจสอบ
          </button>
        )}

        {currentStatus === "MANAGER_REVIEW" && (
          <button
            onClick={() => handleAction("APPROVE")}
            disabled={loadingAction === "APPROVE"}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <CheckCircle className="w-4 h-4" />
            อนุมัติตาราง
          </button>
        )}

        {currentStatus === "APPROVED" && (
          <button
            onClick={() => handleAction("PUBLISH")}
            disabled={loadingAction === "PUBLISH"}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-emerald-500/20"
          >
            <Share2 className="w-4 h-4" />
            เผยแพร่ตาราง (Publish)
          </button>
        )}

        {currentStatus === "PUBLISHED" && (
          <button
            onClick={() => handleAction("LOCK")}
            disabled={loadingAction === "LOCK"}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Lock className="w-4 h-4" />
            ล็อคตาราง (Lock)
          </button>
        )}

        {currentStatus === "LOCKED" && (
          <button
            onClick={() => handleAction("UNLOCK")}
            disabled={loadingAction === "UNLOCK"}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Unlock className="w-4 h-4" />
            ปลดล็อค (Unlock)
          </button>
        )}
      </div>
    </div>
  );
}
