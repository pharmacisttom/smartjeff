"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  ShieldCheck,
} from "lucide-react";

export default function SloDashboard() {
  const [slos, setSlos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSlos = async () => {
    try {
      const res = await fetch("/api/platform/slo");
      const data = await res.json();
      setSlos(data.slos || []);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlos();
  }, []);

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
              <Zap className="w-6 h-6 text-amber-400" />
              Service Level Objectives (SLO) & Error Budget Dashboard
            </h1>
            <p className="text-sm text-slate-400">
              ติดตามตัวชี้วัดความพร้อมใช้งาน (SLI/SLO) รอบ 30 วัน, คำนวณ Error Budget และควบคุมเสถียรภาพระบบเชิงรุก
            </p>
          </div>
        </div>

        <button
          onClick={fetchSlos}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </div>

      {/* SRE Principle Alert */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-3 text-sm text-blue-300">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
        <div>
          <b>SRE Cultural Guardrail:</b> ตัวชี้วัด SLO และ Error Budget มีไว้เพื่อการวางแผนเชิงระบบและการปรับสมดุลระหว่างความเร็วในการพัฒนา (Speed) กับความเสถียร (Reliability) ไม่ได้มีไว้เพื่อกล่าวโทษบุคคล (No-Blame Culture)
        </div>
      </div>

      {/* SLO Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {slos.map((slo) => (
          <div key={slo.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 mb-1 inline-block">
                  {slo.service}
                </span>
                <h2 className="text-lg font-bold text-white">{slo.name}</h2>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> {slo.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-xs text-slate-400">เป้าหมาย (Target)</span>
                <div className="text-xl font-bold text-white">{slo.targetPercentage}%</div>
              </div>
              <div>
                <span className="text-xs text-slate-400">ทำได้จริง (Actual 30d)</span>
                <div className="text-xl font-bold text-emerald-400">{slo.actualPercentage}%</div>
              </div>
            </div>

            {/* Error Budget Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Error Budget ที่ใช้ไป
                </span>
                <span className="text-slate-200 font-medium">
                  {slo.consumedBudgetMinutes} / {slo.errorBudgetMinutes} นาที ({slo.remainingBudgetMinutes} นาทีคงเหลือ)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    slo.consumedBudgetMinutes > slo.errorBudgetMinutes * 0.75
                      ? "bg-rose-500"
                      : slo.consumedBudgetMinutes > slo.errorBudgetMinutes * 0.5
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      slo.errorBudgetMinutes > 0 ? (slo.consumedBudgetMinutes / slo.errorBudgetMinutes) * 100 : 0
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
