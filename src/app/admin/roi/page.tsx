'use me'
'use client';

import React, { useState } from 'react';
import { calculateROI, DEFAULT_BASELINE, DEFAULT_CURRENT, BaselineMetrics, CurrentMetrics } from '@/lib/roi/calculate';
import { TrendingUp, DollarSign, Clock, AlertTriangle, ShieldCheck, Download, Sliders, Calendar } from 'lucide-react';

export default function ROIDashboardPage() {
  const [baseline, setBaseline] = useState<BaselineMetrics>(DEFAULT_BASELINE);
  const [current, setCurrent] = useState<CurrentMetrics>(DEFAULT_CURRENT);
  const [subCost, setSubCost] = useState<number>(8000);
  const [period, setPeriod] = useState<string>('2026-09');

  const roi = calculateROI(baseline, current, subCost);

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>SMARTO Executive Operations</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1">
            💰 Executive ROI & Value Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            วิเคราะห์ความคุ้มค่าการลงทุน และผลตอบแทนทางการเงินจริงขององค์กร
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-2 rounded-xl text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="2026-09" className="bg-slate-900">กันยายน 2569</option>
              <option value="2026-08" className="bg-slate-900">สิงหาคม 2569</option>
              <option value="2026-07" className="bg-slate-900">กรกฎาคม 2569</option>
            </select>
          </div>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/30"
          >
            <Download className="w-4 h-4" />
            Export Executive PDF
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 p-6 rounded-2xl border border-emerald-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-400">
            <DollarSign className="w-24 h-24" />
          </div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">ประหยัดรวมเดือนนี้</p>
          <p className="text-3xl font-black text-emerald-400 mt-2">
            ฿{roi.savings.total.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-2">คำนวณจาก 5 หมวดประสิทธิภาพ</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-950/60 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 shadow-xl relative overflow-hidden">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">ผลประโยชน์สุทธิ (Net Benefit)</p>
          <p className="text-3xl font-black text-indigo-300 mt-2">
            ฿{roi.netBenefit.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-2">หักลบค่าบริการระบบแล้ว</p>
        </div>

        <div className="bg-gradient-to-br from-blue-950/60 to-slate-900 p-6 rounded-2xl border border-blue-500/30 shadow-xl relative overflow-hidden">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">อัตราผลตอบแทน ROI</p>
          <p className="text-3xl font-black text-blue-400 mt-2">
            +{roi.roiPercent}%
          </p>
          <p className="text-xs text-slate-400 mt-2">คุ้มค่ากว่าการทำงาน manual</p>
        </div>

        <div className="bg-gradient-to-br from-purple-950/60 to-slate-900 p-6 rounded-2xl border border-purple-500/30 shadow-xl relative overflow-hidden">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">ระยะเวลาคืนทุน</p>
          <p className="text-3xl font-black text-purple-300 mt-2">
            {roi.breakEvenMonthsStr}
          </p>
          <p className="text-xs text-slate-400 mt-2">Payback Period</p>
        </div>
      </div>

      {/* Main Grid: Breakdown & Cost */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Savings Breakdown */}
        <div className="lg:col-span-2 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            การลดต้นทุนแยกตามหมวด (Savings Breakdown)
          </h2>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>1. ลดเวลาทำงานล่วงเวลา (OT Reduction)</span>
                <span className="text-emerald-400 font-bold">฿{roi.savings.ot.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (roi.savings.ot / roi.savings.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ลดลงจาก {baseline.avgOTHours} ชม. เหลือ {current.avgOTHours} ชม./คน/เดือน
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>2. ประหยัดค่าเดินทาง & น้ำมัน (Travel Optimization)</span>
                <span className="text-blue-400 font-bold">฿{roi.savings.travel.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (roi.savings.travel / roi.savings.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ลดลงจาก {baseline.avgTravelKm} กม. เหลือ {current.avgTravelKm} กม./คน/วัน
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>3. ประหยัดเวลาทำงาน manual ของ HR</span>
                <span className="text-indigo-400 font-bold">฿{roi.savings.hrTime.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (roi.savings.hrTime / roi.savings.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                HR ทำงานลดลงจาก {baseline.hrHoursPerMonth} ชม. เหลือ {current.hrHours} ชม./เดือน
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>4. ลดความผิดพลาดในงาน (Error Reduction)</span>
                <span className="text-purple-400 font-bold">฿{roi.savings.errorReduction.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (roi.savings.errorReduction / roi.savings.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                อัตราผิดพลาดลดลงจาก {baseline.errorRate}% เหลือ {current.errorRate}%
              </p>
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1">
                <span>5. ลดการขาดงานของพนักงาน (Absence Control)</span>
                <span className="text-amber-400 font-bold">฿{roi.savings.absenceReduction.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (roi.savings.absenceReduction / roi.savings.total) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                อัตราขาดงานลดลงจาก {baseline.absenceRate}% เหลือ {current.absenceRate}%
              </p>
            </div>
          </div>
        </div>

        {/* Cost Analysis & Controls */}
        <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            ปรับตั้งค่า Baseline & Subscription
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">ค่าบริการระบบ SMARTO (รายเดือน)</label>
              <input
                type="number"
                value={subCost}
                onChange={(e) => setSubCost(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">จำนวนพนักงานทั้งหมด (Headcount)</label>
              <input
                type="number"
                value={current.headcount}
                onChange={(e) => {
                  const hc = Number(e.target.value);
                  setCurrent({ ...current, headcount: hc });
                  setBaseline({ ...baseline, headcount: hc });
                }}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">ชม. OT เฉลี่ยปัจจุบัน (ชม./คน/เดือน)</label>
              <input
                type="number"
                value={current.avgOTHours}
                onChange={(e) => setCurrent({ ...current, avgOTHours: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-white font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">ระยะทางเฉลี่ยปัจจุบัน (กม./คน/วัน)</label>
              <input
                type="number"
                value={current.avgTravelKm}
                onChange={(e) => setCurrent({ ...current, avgTravelKm: Number(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-white font-mono"
              />
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-400">ต้นทุนระบบรวม:</span>
              <span className="text-red-400">฿{roi.costs.total.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
