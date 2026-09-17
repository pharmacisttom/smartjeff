"use client";

import React, { useState, useEffect } from "react";
import {
  Landmark,
  Scale,
  PieChart,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Play,
  Sliders,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Info,
  DollarSign,
  Briefcase,
} from "lucide-react";
import Swal from "sweetalert2";

export default function ExecutiveFinancialControlCenter() {
  const [loading, setLoading] = useState(true);
  const [positionData, setPositionData] = useState<any>(null);
  const [budgetPlans, setBudgetPlans] = useState<any[]>([]);

  // Simulation State
  const [scenarioName, setScenarioName] = useState("ความล่าช้าการชำระเงินของลูกค้า 30 วัน");
  const [collectionDelay, setCollectionDelay] = useState(30);
  const [otIncrease, setOtIncrease] = useState(20);
  const [fuelIncrease, setFuelIncrease] = useState(10);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const [posRes, bgtRes] = await Promise.all([
        fetch("/api/finance/treasury/position"),
        fetch("/api/finance/budgets"),
      ]);

      const pos = await posRes.json();
      const bgt = await bgtRes.json();

      if (pos.success) setPositionData(pos);
      if (bgt.success) setBudgetPlans(bgt.plans || []);
    } catch (err: any) {
      console.error(err);
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: "ไม่สามารถดึงข้อมูลศูนย์ควบคุมการเงินได้" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    runSimulation(30, 20, 10);
  }, []);

  const runSimulation = async (delayDays = collectionDelay, otPct = otIncrease, fuelPct = fuelIncrease) => {
    try {
      setSimulating(true);
      const res = await fetch("/api/finance/scenarios/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scenarioName,
          clientCollectionDelayDays: delayDays,
          overtimeIncreasePct: otPct,
          fuelPriceIncreasePct: fuelPct,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSimulationResult(data.result);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setSimulating(false);
    }
  };

  const brief = positionData?.brief || {
    headlineText: "กำลังสร้างรายงานสรุปประจำวัน...",
    summaryMetrics: {},
    whatChanged: [],
  };

  const kpi = positionData?.position?.kpi || {
    totalCash: 0,
    reconciledCash: 0,
    availableCash: 0,
    net7Days: 0,
  };

  const primaryBudget = budgetPlans[0] || {
    totalAllocated: 0,
    totalConsumed: 0,
    totalCommitted: 0,
    burnRatePercentage: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
              Phase 21 — Executive Command
            </span>
            <span className="text-xs text-slate-500">Chief Financial Control Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2.5">
            <Landmark className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            ศูนย์ควบคุมการเงินผู้บริหาร (Executive Financial Control)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            รายงานสถานะสภาพคล่องรวม การกระทบยอด ผลต่างงบประมาณ และแบบจำลองวิเคราะห์ความเสี่ยง What-If
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรชข้อมูล
          </button>
        </div>
      </div>

      {/* Daily Financial Brief Card */}
      <div className="bg-gradient-to-r from-purple-900/90 to-indigo-900/90 rounded-2xl p-6 text-white shadow-lg space-y-3 relative overflow-hidden">
        <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          สรุปสถานการณ์ทางการเงินประจำวัน (Daily Financial Executive Brief)
        </div>
        <div className="text-lg md:text-xl font-bold leading-relaxed">
          "{brief.headlineText}"
        </div>
        <div className="text-xs text-purple-200/80 pt-1">
          * ข้อมูลสังเคราะห์จากระบบบันทึกบัญชี Cash Ledger, Statement ธนาคาร และแผนการใช้จ่ายจริงโดยไม่มีการประมาณการลอย
        </div>
      </div>

      {/* Quick Access Navigation Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="/admin/finance/treasury"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Treasury & สภาพคล่อง</div>
              <div className="text-xs text-slate-500">คาดการณ์กระแสเงินสด 13 สัปดาห์</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition" />
        </a>

        <a
          href="/admin/finance/reconciliation"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Bank Reconciliation</div>
              <div className="text-xs text-slate-500">กระทบยอดรายการเดินบัญชี</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
        </a>

        <a
          href="/admin/finance/budget"
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-500 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 dark:text-white">Budget & Commitment</div>
              <div className="text-xs text-slate-500">ควบคุมและโยกย้ายงบประมาณ</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition" />
        </a>
      </div>

      {/* Main Grid: What Changed & Scenario Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: What Changed / Financial Alerts (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                ความเปลี่ยนแปลงสำคัญ (What Changed)
              </h2>
              <span className="text-xs text-slate-500">{brief.whatChanged?.length || 0} รายการ</span>
            </div>

            <div className="space-y-2.5">
              {brief.whatChanged && brief.whatChanged.length > 0 ? (
                brief.whatChanged.map((alert: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                      alert.severity === "CRITICAL"
                        ? "bg-rose-50/60 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 text-rose-900 dark:text-rose-200"
                        : "bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 text-amber-900 dark:text-amber-200"
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span className="px-1.5 py-0.2 rounded bg-black/10 text-[10px] font-mono">
                        {alert.category}
                      </span>
                      {alert.title}
                    </div>
                    <div className="text-[11px] opacity-90">{alert.detail}</div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1 opacity-70" />
                  ระบบการเงินและสภาพคล่องอยู่ในสภาวะปกติ ไม่มีรายการเตือนความเสี่ยง
                </div>
              )}
            </div>
          </div>

          {/* Quick Budget Health Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              ภาพรวมการใช้งบประมาณองค์กร (Budget Health)
            </h3>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>งบที่จัดสรรทั้งหมด:</span>
              <strong className="text-slate-900 dark:text-white">
                ฿{primaryBudget.totalAllocated?.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>ใช้จริง + ผูกพัน (Actual + Committed):</span>
              <strong className="text-slate-900 dark:text-white">
                ฿{(primaryBudget.totalConsumed + primaryBudget.totalCommitted)?.toLocaleString()}
              </strong>
            </div>
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span>อัตราการเบิกใช้ (Burn Rate):</span>
              <strong className="text-blue-600 font-bold">{primaryBudget.burnRatePercentage}%</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Scenario Simulator (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                Interactive What-If Simulation
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-500" />
                แบบจำลองสถานการณ์สภาพคล่อง (Treasury Scenario Planning)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                จำลองผลกระทบในหน่วยความจำโดยไม่กระทบข้อมูลจริง เพื่อการตัดสินใจและจัดสรรเงินทุนล่วงหน้า
              </p>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                ลูกหนี้จ่ายช้า: <span className="text-purple-600 font-bold">{collectionDelay} วัน</span>
              </label>
              <input
                type="range"
                min="0"
                max="60"
                step="15"
                value={collectionDelay}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setCollectionDelay(val);
                  runSimulation(val, otIncrease, fuelIncrease);
                }}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>ตรงกำหนด</span>
                <span>30 วัน</span>
                <span>60 วัน</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                ค่าล่วงเวลา (OT) เพิ่มขึ้น: <span className="text-purple-600 font-bold">+{otIncrease}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="10"
                value={otIncrease}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setOtIncrease(val);
                  runSimulation(collectionDelay, val, fuelIncrease);
                }}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span>+20%</span>
                <span>+50%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300">
                ราคาน้ำมันและขนส่ง: <span className="text-purple-600 font-bold">+{fuelIncrease}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="30"
                step="5"
                value={fuelIncrease}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setFuelIncrease(val);
                  runSimulation(collectionDelay, otIncrease, val);
                }}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span>+10%</span>
                <span>+30%</span>
              </div>
            </div>
          </div>

          {/* Simulation Output Card */}
          {simulationResult && (
            <div className="p-5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/40 dark:bg-purple-950/20 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                    ผลการประเมินสถานการณ์
                  </span>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                    {simulationResult.impactSummary}
                  </p>
                </div>
                {simulationResult.simulated.hasShortfall ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 whitespace-nowrap">
                    มีความเสี่ยงเงินสดติดลบ
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 whitespace-nowrap">
                    สภาพคล่องเพียงพอ
                  </span>
                )}
              </div>

              {/* Comparison Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">เงินต่ำสุด (เดิม)</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                    ฿{simulationResult.baseline.minimumCash.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">เงินต่ำสุด (จำลอง)</div>
                  <div
                    className={`font-bold text-sm mt-0.5 ${
                      simulationResult.simulated.minimumCash < 0 ? "text-rose-600" : "text-slate-800 dark:text-slate-200"
                    }`}
                  >
                    ฿{simulationResult.simulated.minimumCash.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">สัปดาห์ที่เริ่มขาดสภาพคล่อง</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
                    {simulationResult.simulated.shortfallWeek
                      ? `สัปดาห์ที่ W${simulationResult.simulated.shortfallWeek}`
                      : "ไม่ติดลบ"}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-slate-500">ประมาณการ Funding Gap</div>
                  <div className="font-bold text-sm text-purple-600 dark:text-purple-400 mt-0.5">
                    ฿{simulationResult.simulated.fundingGap.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
