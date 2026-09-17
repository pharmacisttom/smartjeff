"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  Radio,
  Smartphone,
  FileSpreadsheet,
} from "lucide-react";
import Swal from "@/lib/swal";

export default function BusinessContinuityDashboard() {
  const [maintenance, setMaintenance] = useState<any>({
    mode: "NORMAL",
    active: false,
    reason: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/platform/maintenance");
      const data = await res.json();
      setMaintenance(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleModeChange = async (targetMode: string) => {
    let reason = "";
    if (targetMode !== "NORMAL") {
      const { value: text } = await Swal.fire({
        title: `เปิดใช้งานโหมด ${targetMode}`,
        input: "textarea",
        inputLabel: "ระบุเหตุผลในการเปลี่ยนโหมด (Reason)",
        inputPlaceholder: "เช่น Database Migration, Network Upgrade...",
        showCancelButton: true,
        confirmButtonText: "ยืนยันการตั้งค่า",
        cancelButtonText: "ยกเลิก",
      });
      if (text === undefined) return;
      reason = text;
    }

    try {
      setUpdating(true);
      const res = await fetch("/api/platform/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: targetMode,
          reason,
          bypassRoles: ["ADMIN", "PLATFORM_ADMIN", "SRE"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "อัปเดตสถานะสำเร็จ",
          text: `ระบบทำงานในโหมด: ${targetMode}`,
        });
        fetchStatus();
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err.message,
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/platform"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              Business Continuity Platform (BCP) & Maintenance Controls
            </h1>
            <p className="text-sm text-slate-400">
              ควบคุมโหมดการบำรุงรักษา, โหมดอ่านอย่างเดียว (Read-Only), และความพร้อมใช้งานต่อเนื่องเมื่อเกิดวิกฤต
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </div>

      {/* Mode Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* NORMAL */}
        <div
          onClick={() => handleModeChange("NORMAL")}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            maintenance.mode === "NORMAL"
              ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-emerald-400">ปกติ (Normal)</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white mb-1">NORMAL MODE</div>
          <p className="text-xs text-slate-400">ระบบเปิดให้บริการครบทุกฟังก์ชันทั้ง Read & Write</p>
        </div>

        {/* READ ONLY */}
        <div
          onClick={() => handleModeChange("READ_ONLY")}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            maintenance.mode === "READ_ONLY"
              ? "bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-amber-400">อ่านอย่างเดียว</span>
            <Eye className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-white mb-1">READ-ONLY MODE</div>
          <p className="text-xs text-slate-400">บล็อกการแก้ไข/เขียนข้อมูล อนุญาตเฉพาะการดูข้อมูล (เหมาะกับช่วง Migration)</p>
        </div>

        {/* MAINTENANCE */}
        <div
          onClick={() => handleModeChange("MAINTENANCE")}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            maintenance.mode === "MAINTENANCE"
              ? "bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/5"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-rose-400">ปรับปรุงระบบ</span>
            <Wrench className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-lg font-bold text-white mb-1">MAINTENANCE</div>
          <p className="text-xs text-slate-400">ปิดการเข้าใช้งานทั่วไป แสดงหน้า /maintenance (Admin/SRE เข้าได้ปกติ)</p>
        </div>

        {/* DEGRADED */}
        <div
          onClick={() => handleModeChange("DEGRADED")}
          className={`p-5 rounded-2xl border cursor-pointer transition ${
            maintenance.mode === "DEGRADED"
              ? "bg-purple-500/10 border-purple-500/40 shadow-lg shadow-purple-500/5"
              : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-purple-400">โหมดประคอง</span>
            <Radio className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white mb-1">DEGRADED MODE</div>
          <p className="text-xs text-slate-400">ปิดบริการรองชั่วคราวเพื่อให้ Core Operations ทำงานต่อได้</p>
        </div>
      </div>

      {/* Critical Business Functions Status */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-lg font-bold text-white">ความต่อเนื่องของฟังก์ชันธุรกิจสำคัญ (Critical Business Functions)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 font-medium text-white mb-1">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              การลงเวลาหน้างาน (Attendance PWA)
            </div>
            <p className="text-xs text-slate-400 mb-2">รองรับ Offline Sync ในเครื่องพนักงานอัตโนมัติ (Phase 13)</p>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              OFFLINE-READY
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 font-medium text-white mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              การแจ้งเหตุฉุกเฉิน QHSE / SOS
            </div>
            <p className="text-xs text-slate-400 mb-2">ระบบส่ง SMS และโทรศัพท์ Fallback ตรงถึงผู้รับผิดชอบหน้างาน</p>
            <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              FALLBACK-ACTIVE
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 font-medium text-white mb-1">
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
              การอนุมัติเบิกจ่ายการเงินเร่งด่วน
            </div>
            <p className="text-xs text-slate-400 mb-2">สามารถดำเนินการได้ผ่าน Secure Emergency Approval Portal</p>
            <span className="text-xs text-blue-400 font-semibold bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              OPERATIONAL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
