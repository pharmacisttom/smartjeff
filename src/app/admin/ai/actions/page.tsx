"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  Lock,
  RefreshCw,
  Zap,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";

export default function AIActionCatalogPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/policies")
      .then((res) => res.json())
      .then((data) => setPolicies(data.policies || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/ai/governance"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-400" />
              Agent Action Catalog & Permission Map
            </h1>
            <p className="text-sm text-slate-400">
              คลังการกระทำทั้งหมดที่ระบบ AI ได้รับอนุญาตให้ช่วยร่างและเสนอ (Action Capabilities)
            </p>
          </div>
        </div>

        <Link
          href="/admin/executive/copilot"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-600/20 transition"
        >
          <Zap className="w-4 h-4" />
          ทดลองสั่งงานใน Copilot
        </Link>
      </div>

      {/* Grid of Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {policies.map((p) => (
          <div key={p.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-slate-300">
                {p.domain}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  p.riskLevel === "CRITICAL"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : p.riskLevel === "HIGH"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}
              >
                {p.riskLevel} RISK
              </span>
            </div>

            <h2 className="text-base font-bold text-white tracking-tight">{p.actionType}</h2>

            <div className="text-xs text-slate-400 space-y-1 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex justify-between">
                <span>Confirmation Mode:</span>
                <span className="font-mono text-slate-200">{p.confirmationMode}</span>
              </div>
              <div className="flex justify-between">
                <span>Source Origin:</span>
                <span className="text-blue-400 font-medium">AI_ASSISTED</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-slate-500">Human Approval:</span>
              <span className="text-slate-300 font-medium">
                {p.confirmationMode === "FORBIDDEN" ? "BLOCKED" : "Required prior to execution"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
