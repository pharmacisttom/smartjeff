"use client";

import React from "react";
import {
  CalendarDays,
  Users,
  AlertTriangle,
  Clock,
  UserX,
  TrendingUp,
  ShieldCheck,
  Lock,
} from "lucide-react";

interface ScheduleKpiCardsProps {
  summary: {
    totalScheduled: number;
    workingToday: number;
    understaffedShifts: number;
    lateToday: number;
    absentToday: number;
    projectedOtHours: number;
    conflictCount: number;
    periodStatus: string;
    version: number;
  };
}

export function ScheduleKpiCards({ summary }: ScheduleKpiCardsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
          label: "เผยแพร่แล้ว (Published)",
        };
      case "LOCKED":
        return {
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
          label: "ล็อคตาราง (Locked)",
        };
      case "APPROVED":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
          label: "อนุมัติแล้ว (Approved)",
        };
      case "MANAGER_REVIEW":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
          label: "รอผู้จัดการตรวจ (Review)",
        };
      default:
        return {
          bg: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
          label: "ร่างตาราง (Draft)",
        };
    }
  };

  const statusBadge = getStatusBadge(summary.periodStatus);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
      {/* 1. Total Scheduled */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-xs font-medium">กะที่จัดแล้ว</span>
          <CalendarDays className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{summary.totalScheduled}</div>
          <div className="text-[11px] text-zinc-500">คน-กะ ในช่วงเวลา</div>
        </div>
      </div>

      {/* 2. Working Today */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-xs font-medium">เข้างานวันนี้</span>
          <Users className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-400">{summary.workingToday}</div>
          <div className="text-[11px] text-zinc-500">กำลังปฏิบัติงาน</div>
        </div>
      </div>

      {/* 3. Understaffed Shifts */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-xs font-medium">กะที่คนขาด</span>
          <AlertTriangle className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-rose-400">{summary.understaffedShifts}</div>
          <div className="text-[11px] text-rose-400/70">ต่ำกว่าเป้าหมาย</div>
        </div>
      </div>

      {/* 4. Absent Today */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-xs font-medium">ขาดงาน</span>
          <UserX className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{summary.absentToday}</div>
          <div className="text-[11px] text-zinc-500">ไม่พบการลงเวลา</div>
        </div>
      </div>

      {/* 5. Projected OT */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-xs font-medium">พยากรณ์ OT</span>
          <TrendingUp className="w-4 h-4 text-orange-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-orange-400">{summary.projectedOtHours}</div>
          <div className="text-[11px] text-zinc-500">ชั่วโมงสะสม</div>
        </div>
      </div>

      {/* 6. Conflict Count */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-xs font-medium">ข้อขัดแย้ง</span>
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-cyan-400">{summary.conflictCount}</div>
          <div className="text-[11px] text-zinc-500">เวลาพัก / ลา</div>
        </div>
      </div>

      {/* 7. Period Status */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between hover:border-zinc-700 transition">
        <div className="flex items-center justify-between text-zinc-400 mb-1">
          <span className="text-xs font-medium">สถานะตาราง</span>
          <Lock className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <span
            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${statusBadge.bg}`}
          >
            {statusBadge.label}
          </span>
          <div className="text-[11px] text-zinc-500 mt-1">เวอร์ชัน v{summary.version}</div>
        </div>
      </div>
    </div>
  );
}
