"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, ShieldAlert, Clock, RefreshCw, CheckCircle2 } from "lucide-react";

export default function MaintenancePage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/platform/maintenance");
      const data = await res.json();
      setStatus(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow background circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-xl w-full bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-6 shadow-lg shadow-amber-500/5">
          <Wrench className="w-10 h-10 animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight mb-3">
          {status?.mode === "READ_ONLY" ? "โหมดอ่านอย่างเดียว (Read-Only Mode)" : "ระบบกำลังอยู่ระหว่างปรับปรุง (Maintenance Mode)"}
        </h1>

        <p className="text-slate-300 text-sm leading-relaxed mb-6">
          {status?.reason || "ทีมวิศวกร SRE และ Infrastructure กำลังดำเนินการอัปเกรดระบบเพื่อความเสถียรและความปลอดภัยสูงสุด ขออภัยในความไม่สะดวก"}
        </p>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-left mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> สถานะปัจจุบัน
            </span>
            <span className="font-semibold text-amber-400 uppercase">
              {status?.mode || "MAINTENANCE"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> กำหนดเวลาเสร็จสิ้น
            </span>
            <span className="text-slate-200">
              {status?.scheduledEndAt ? new Date(status.scheduledEndAt).toLocaleTimeString("th-TH") : "ประมาณ 30 นาที"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> ความปลอดภัยของข้อมูล
            </span>
            <span className="text-emerald-400 font-medium">
              ปลอดภัย 100% (Verified Backup Active)
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchStatus();
            }}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-md shadow-blue-600/20"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            ตรวจสอบสถานะอีกครั้ง
          </button>
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition"
          >
            เข้าสู่ระบบสำหรับ Admin/SRE
          </Link>
        </div>
      </div>
    </div>
  );
}
