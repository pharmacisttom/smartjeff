"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  ArrowLeft,
  CheckCircle2,
  Lock,
  RefreshCw,
  Zap,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export default function SpecializedAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/agents")
      .then((res) => res.json())
      .then((data) => setAgents(data.agents || []))
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
              <Bot className="w-6 h-6 text-purple-400" />
              Specialized Enterprise Agents
            </h1>
            <p className="text-sm text-slate-400">
              ตัวแทนอัจฉริยะเฉพาะทาง (Constrained Domain Agents) พร้อมขอบเขตเครื่องมือและเพดานความเสี่ยงที่ได้รับอนุญาต
            </p>
          </div>
        </div>

        <Link
          href="/admin/executive/copilot"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-purple-600/20 transition"
        >
          <Zap className="w-4 h-4" />
          ใช้งาน Copilot
        </Link>
      </div>

      {/* Grid of Agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((ag) => (
          <div key={ag.code} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{ag.name}</h2>
                  <span className="text-xs font-mono text-purple-400">{ag.code}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{ag.description}</p>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Domain:</span>
                <span className="text-slate-200 font-mono font-semibold">{ag.domain}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Max Allowed Risk:</span>
                <span className="text-amber-400 font-semibold">{ag.maxRiskLevel}</span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block mb-1">Allowed Tools ({ag.allowedTools?.length || 0}):</span>
                <div className="flex flex-wrap gap-1.5">
                  {ag.allowedTools?.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700/60">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
