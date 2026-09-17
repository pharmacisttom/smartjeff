"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Power,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  FileText,
  Lock,
  ArrowRight,
} from "lucide-react";
import Swal from "@/lib/swal";

export default function AIGovernanceDashboard() {
  const [metrics, setMetrics] = useState({
    totalProposals: 0,
    approvedCount: 0,
    rejectedCount: 0,
    completedCount: 0,
    failedCount: 0,
    aiActionsEnabled: true,
  });
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, propRes] = await Promise.all([
        fetch("/api/ai/policies"),
        fetch("/api/ai/proposals"),
      ]);
      const pData = await pRes.json();
      const propData = await propRes.json();

      setPolicies(pData.policies || []);
      const allProps = propData.proposals || [];
      setMetrics({
        totalProposals: allProps.length,
        approvedCount: allProps.filter((p: any) => p.status === "APPROVED").length,
        rejectedCount: allProps.filter((p: any) => p.status === "REJECTED").length,
        completedCount: allProps.filter((p: any) => p.status === "COMPLETED").length,
        failedCount: allProps.filter((p: any) => p.status === "FAILED").length,
        aiActionsEnabled: true,
      });
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleKillSwitch = async () => {
    const nextState = !metrics.aiActionsEnabled;
    const confirm = await Swal.fire({
      title: nextState ? "เปิดใช้งานระบบการกระทำของ AI?" : "เปิด Emergency Kill-Switch (ระงับ Action ทั้งหมด)?",
      text: nextState
        ? "ระบบจะอนุญาตให้ AI สร้างและเสนอ Action Proposals ตามปกติ"
        : "ระบบจะบล็อกคำสั่งสร้าง Proposal และบล็อกการ Execute ของ AI ทุกกรณีทันที (Read-only Q&A ยังทำงานได้)",
      icon: nextState ? "question" : "warning",
      showCancelButton: true,
      confirmButtonText: nextState ? "เปิดใช้งาน" : "สั่งตัดการทำงานทันที",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: nextState ? "#2563eb" : "#e11d48",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch("/api/ai/governance/kill-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !nextState, adminName: "Security Administrator" }),
      });
      const data = await res.json();
      if (data.success) {
        setMetrics((prev) => ({ ...prev, aiActionsEnabled: !data.killSwitchActive }));
        Swal.fire({
          icon: "success",
          title: "อัปเดต Kill-Switch สำเร็จ",
          text: `สถานะ AI Actions: ${!data.killSwitchActive ? "ENABLED" : "DISABLED (KILL SWITCH ACTIVE)"}`,
        });
      }
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "ข้อผิดพลาด", text: err.message });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              AI Action Governance & Safety Control Center
            </h1>
            <p className="text-sm text-slate-400">
              Phase 26 — ควบคุมความปลอดภัย Agentic AI, สวิตช์ฉุกเฉิน Kill-Switch และนโยบาย Human-in-the-Loop
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรช
          </button>
          <button
            onClick={handleToggleKillSwitch}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg ${
              metrics.aiActionsEnabled
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
            }`}
          >
            <Power className="w-4 h-4" />
            {metrics.aiActionsEnabled ? "Emergency Kill-Switch (ตัดการทำงาน)" : "Resume AI Actions (เปิดทำงาน)"}
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between ${
          metrics.aiActionsEnabled
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            : "bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse"
        }`}
      >
        <div className="flex items-center gap-3">
          {metrics.aiActionsEnabled ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
          <div>
            <div className="font-semibold text-sm">
              สถานะสวิตช์ระบบ: {metrics.aiActionsEnabled ? "AI ACTIONS ACTIVE (NORMAL)" : "KILL-SWITCH ACTIVE (ALL WRITES BLOCKED)"}
            </div>
            <div className="text-xs opacity-80">
              {metrics.aiActionsEnabled
                ? "AI สามารถสร้างข้อเสนอ Action Proposals และรอการยืนยันจากมนุษย์ตามปกติ"
                : "การกระทำและร่างข้อเสนอทั้งหมดของ AI ถูกระงับการทำงานชั่วคราวเพื่อความปลอดภัยสูงสุด"}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400">ข้อเสนอทั้งหมด (Total Proposals)</span>
          <div className="text-2xl font-bold text-white mt-1">{metrics.totalProposals}</div>
          <p className="text-xs text-slate-400 mt-2">AI-prepared actionable drafts</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400">มนุษย์อนุมัติ (Human Approved)</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.approvedCount + metrics.completedCount}</div>
          <p className="text-xs text-slate-400 mt-2">Verified by human supervisors</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400">ปฏิเสธ / ยกเลิก (Rejected)</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.rejectedCount}</div>
          <p className="text-xs text-slate-400 mt-2">Declined during preview</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold uppercase text-slate-400">ความปลอดภัยสูงสุด (Critical Blocked)</span>
          <div className="text-2xl font-bold text-purple-400 mt-1 flex items-center gap-1.5">
            <Lock className="w-5 h-5" /> 100%
          </div>
          <p className="text-xs text-slate-400 mt-2">Zero autonomous payment/payroll</p>
        </div>
      </div>

      {/* AI Action Policy Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">AI Action Policy Matrix (เมทริกซ์นโยบายการควบคุม)</h2>
            <p className="text-xs text-slate-400">กำหนดระดับความเสี่ยง (Risk Class) และเงื่อนไขการอนุมัติก่อนทำ Action จริง</p>
          </div>
          <Link
            href="/admin/executive/copilot"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
          >
            เปิด Copilot Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase">
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Confirmation Mode</th>
                <th className="py-3 px-4">AI Execution Permission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {policies.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-300 font-semibold">{p.domain}</td>
                  <td className="py-3.5 px-4 font-medium text-white">{p.actionType}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                        p.riskLevel === "CRITICAL"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : p.riskLevel === "HIGH"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : p.riskLevel === "MEDIUM"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300">
                      {p.confirmationMode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.confirmationMode === "FORBIDDEN" ? (
                      <span className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> FORBIDDEN TO AI
                      </span>
                    ) : p.confirmationMode === "APPROVAL_WORKFLOW" ? (
                      <span className="text-xs text-amber-400 font-medium">Requires Multi-Tier Approval</span>
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium">Draft + User Confirm</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
