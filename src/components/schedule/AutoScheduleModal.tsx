"use client";

import React, { useState } from "react";
import { X, Sparkles, Sliders, CheckCircle2, ShieldAlert } from "lucide-react";
import Swal from "sweetalert2";

interface AutoScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onGenerated: () => void;
}

export function AutoScheduleModal({
  isOpen,
  onClose,
  startDate,
  endDate,
  onGenerated,
}: AutoScheduleModalProps) {
  const [mode, setMode] = useState<
    "BALANCED" | "MINIMIZE_OT" | "SKILL_PRIORITY" | "REST_PRIORITY" | "DISTANCE_PRIORITY"
  >("BALANCED");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: "BALANCED",
      name: "สมดุลกำลังพล (Balanced)",
      desc: "กระจายพนักงานให้ได้ตามเป้าหมายขั้นต่ำของแต่ละไซต์อย่างทั่วถึง",
      icon: "⚖️",
    },
    {
      id: "MINIMIZE_OT",
      name: "ลดค่าล่วงเวลา (Minimize OT)",
      desc: "จัดสรรโดยเลือกพนักงานที่มีชั่วโมงงานและ OT สะสมน้อยที่สุดเพื่อคุมงบประมาณ",
      icon: "💰",
    },
    {
      id: "SKILL_PRIORITY",
      name: "เน้นทักษะตรงสาย (Skill Priority)",
      desc: "คัดเลือกพนักงานที่มีทักษะตรงกับความต้องการของหน้างานเป็นอันดับแรก",
      icon: "🎯",
    },
    {
      id: "REST_PRIORITY",
      name: "ลดความล้าและพักผ่อน (Rest Priority)",
      desc: "ให้ความสำคัญกับผู้ที่มีชั่วโมงพักผ่อนมากที่สุด และเว้นระยะวันหยุด",
      icon: "🛌",
    },
    {
      id: "DISTANCE_PRIORITY",
      name: "เน้นระยะทางใกล้ (Distance Priority)",
      desc: "จัดพนักงานที่สังกัดไซต์งานเดิมหรือใกล้เคียงที่สุด เพื่อลดเวลาเดินทาง",
      icon: "📍",
    },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/schedule/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to auto-generate");
      }

      Swal.fire({
        icon: "success",
        title: "สร้างร่างตารางสำเร็จ (Draft Created)",
        text: `ระบบสร้างการมอบหมายกะแบบร่างจำนวน ${data.createdCount} รายการ โดยไม่ละเมิดเงื่อนไขวันลาและเวลาพัก`,
        confirmButtonColor: "#3B82F6",
      });

      onGenerated();
      onClose();
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ผู้ช่วยจัดตารางกะอัตโนมัติ (Rule-Based Assistant)
              </h3>
              <p className="text-xs text-zinc-400">
                ช่วงเวลา: {startDate} ถึง {endDate}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <strong>เกณฑ์ความปลอดภัย:</strong> ระบบจะสร้างตารางในสถานะ <strong>ร่าง (DRAFT)</strong>{" "}
              เท่านั้น โดยปฏิบัติตามกฎวันลา เวลาพักขั้นต่ำ (8 ชม.) และการไม่ซ้ำซ้อนอย่างเคร่งครัด
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300">เลือกโหมดการจัดสรร (Scenario)</label>
            <div className="space-y-2">
              {scenarios.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => setMode(sc.id as any)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                    mode === sc.id
                      ? "bg-purple-500/10 border-purple-500/50 text-white"
                      : "bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700"
                  }`}
                >
                  <span className="text-xl">{sc.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold flex items-center justify-between">
                      <span>{sc.name}</span>
                      {mode === sc.id && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{sc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "กำลังประมวลผลกฎ..." : "สร้างร่างตารางกะ (Generate Draft)"}
          </button>
        </div>
      </div>
    </div>
  );
}
