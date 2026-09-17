"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ShieldCheck, RefreshCw, Layers, CheckCircle2 } from "lucide-react";

export default function RiskDashboardPage() {
  const [heatmap, setHeatmap] = useState<any>(null);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<"residual" | "inherent">("residual");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hmRes, rskRes] = await Promise.all([
        fetch("/api/risk?heatmap=true"),
        fetch("/api/risk?take=50"),
      ]);
      const [hmJson, rskJson] = await Promise.all([hmRes.json(), rskRes.json()]);
      setHeatmap(hmJson);
      setRisks(rskJson.items || []);
    } catch (err) {
      console.error("Failed to load risk data", err);
    } finally {
      setLoading(false);
    }
  };

  const currentGrid = viewType === "residual" ? heatmap?.residualGrid : heatmap?.inherentGrid;

  // Likelihood & Impact labels
  const likelihoodLabels = [
    "5 - Almost Certain (เกิดขึ้นประจำ)",
    "4 - Likely (มีโอกาสสูง)",
    "3 - Possible (เป็นไปได้)",
    "2 - Unlikely (โอกาสน้อย)",
    "1 - Rare (แทบไม่เกิดขึ้น)",
  ];

  const impactLabels = [
    "1 - Insignificant",
    "2 - Minor",
    "3 - Moderate",
    "4 - Major",
    "5 - Catastrophic",
  ];

  const getCellColor = (l: number, i: number) => {
    const score = (l + 1) * (i + 1);
    if (score >= 16) return "bg-red-500/20 border-red-500/40 text-red-700 dark:text-red-300";
    if (score >= 10) return "bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-300";
    if (score >= 5) return "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300";
    return "bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300";
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                ทะเบียนและการประเมินความเสี่ยงองค์กร (Enterprise & Project Risk)
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                5&times;5 Risk Matrix, Inherent vs Residual Risk, Controls & Risk Treatment
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewType("residual")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewType === "residual"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Residual Risk (หลังควบคุม)
            </button>
            <button
              onClick={() => setViewType("inherent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewType === "inherent"
                  ? "bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Inherent Risk (ก่อนควบคุม)
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
          </button>
        </div>
      </div>

      {/* 5x5 Heatmap Matrix Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              แผนผังความเสี่ยง 5&times;5 ({viewType === "residual" ? "Residual Risk Heatmap" : "Inherent Risk Heatmap"})
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500"></span> Low (1-4)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500"></span> Moderate (5-9)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-500"></span> High (10-15)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500"></span> Critical (16-25)
            </span>
          </div>
        </div>

        {/* 5x5 Grid Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-xs font-bold text-slate-400 text-left w-48">
                  Likelihood \ Impact
                </th>
                {impactLabels.map((imp, idx) => (
                  <th key={idx} className="p-2 text-xs font-semibold text-slate-600 dark:text-slate-300 text-center">
                    {imp}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[4, 3, 2, 1, 0].map((lIdx) => (
                <tr key={lIdx}>
                  <td className="p-2 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {likelihoodLabels[4 - lIdx]}
                  </td>
                  {[0, 1, 2, 3, 4].map((iIdx) => {
                    const cell = currentGrid ? currentGrid[lIdx][iIdx] : { count: 0, risks: [] };
                    const cellClass = getCellColor(lIdx, iIdx);
                    return (
                      <td
                        key={iIdx}
                        className={`p-3 text-center border border-slate-200 dark:border-slate-700/60 rounded-xl transition-all ${cellClass}`}
                      >
                        <div className="font-bold text-lg">{cell.count}</div>
                        <div className="text-[10px] opacity-75">
                          Score: {(lIdx + 1) * (iIdx + 1)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Register Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            ตารางทะเบียนความเสี่ยง (Risk Register)
          </h2>
          <span className="text-xs text-slate-500">
            ทั้งหมด {risks.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <th className="py-3">เลขที่</th>
                <th>หัวข้อความเสี่ยง</th>
                <th>หมวดหมู่</th>
                <th>ขอบเขต</th>
                <th>Inherent Risk</th>
                <th>Residual Risk</th>
                <th>กลยุทธ์ (Treatment)</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {risks.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">{r.riskNo}</td>
                  <td className="font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                    {r.title}
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {r.category}
                    </span>
                  </td>
                  <td>{r.scope}</td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold ${
                        r.inherentLevel === "CRITICAL"
                          ? "bg-red-100 text-red-700"
                          : r.inherentLevel === "HIGH"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {r.inherentLevel} ({r.inherentScore})
                    </span>
                  </td>
                  <td>
                    <span
                      className={`px-2 py-0.5 rounded-full font-semibold ${
                        r.residualLevel === "CRITICAL"
                          ? "bg-red-100 text-red-700"
                          : r.residualLevel === "HIGH"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {r.residualLevel} ({r.residualScore})
                    </span>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">
                      {r.treatment}
                    </span>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {risks.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-400">
                    ยังไม่มีข้อมูลในทะเบียนความเสี่ยง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
