"use client";

import React, { useState } from "react";
import { X, UserPlus, Search, Shield, Briefcase, CheckCircle2 } from "lucide-react";
import Swal from "sweetalert2";

interface Worker {
  id: string;
  code: string;
  name: string;
  position: string;
  siteId: string;
  skills: string[];
  isAvailable: boolean;
}

interface UnassignedWorkerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  targetSite?: { id: string; name: string };
  targetShift?: { id: string; name: string };
  targetDate?: string;
  onAssigned: () => void;
}

export function UnassignedWorkerDrawer({
  isOpen,
  onClose,
  workers,
  targetSite,
  targetShift,
  targetDate,
  onAssigned,
}: UnassignedWorkerDrawerProps) {
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.code.toLowerCase().includes(search.toLowerCase()) ||
      w.position.toLowerCase().includes(search.toLowerCase()) ||
      w.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  const handleAssign = async (worker: Worker) => {
    if (!targetSite || !targetShift || !targetDate) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาเลือกไซต์และกะก่อน",
        text: "คลิกที่ช่องกะในตารางเพื่อเลือกไซต์งานและกะเป้าหมาย",
      });
      return;
    }

    setLoadingId(worker.id);
    try {
      const res = await fetch("/api/schedule/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: worker.id,
          siteId: targetSite.id,
          shiftId: targetShift.id,
          workDate: targetDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Show SweetAlert2 Conflict Warning
        const conflicts = data.conflicts || [];
        const conflictMsg =
          conflicts.length > 0
            ? conflicts.map((c: any) => `• ${c.message}`).join("\n")
            : data.error;

        Swal.fire({
          icon: "error",
          title: "ไม่สามารถมอบหมายกะได้ (ตรวจพบข้อขัดแย้ง)",
          html: `<div style="text-align: left; font-size: 14px; white-space: pre-line;">${conflictMsg}</div>`,
          confirmButtonColor: "#EF4444",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "มอบหมายกะสำเร็จ",
          text: `จัด ${worker.name} เข้าสู่ ${targetShift.name} (${targetSite.name}) เรียบร้อยแล้ว`,
          timer: 1500,
          showConfirmButton: false,
        });
        onAssigned();
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
      });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              พนักงานที่พร้อมจัดกะ ({filtered.length})
            </h3>
            {targetSite && targetShift && targetDate && (
              <p className="text-xs text-zinc-400 mt-1">
                เป้าหมาย: <span className="text-blue-400 font-semibold">{targetSite.name}</span> •{" "}
                <span className="text-amber-400 font-semibold">{targetShift.name}</span> (
                {targetDate})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, รหัส, ตำแหน่ง, ทักษะ..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Worker List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              ไม่พบพนักงานว่างที่ตรงกับเงื่อนไข
            </div>
          ) : (
            filtered.map((w) => (
              <div
                key={w.id}
                className="bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 flex items-center justify-between transition group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition">
                      {w.name}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">({w.code})</span>
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-zinc-500" />
                    {w.position}
                  </div>
                  {w.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {w.skills.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAssign(w)}
                  disabled={loadingId === w.id}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:shadow-blue-500/20 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {loadingId === w.id ? "กำลังตรวจ..." : "จัดเข้ากะ"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
