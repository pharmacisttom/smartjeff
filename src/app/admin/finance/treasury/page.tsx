"use client";

import React, { useState, useEffect } from "react";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Layers,
  Wallet,
} from "lucide-react";
import Swal from "sweetalert2";

export default function TreasuryDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [positionData, setPositionData] = useState<any>(null);
  const [forecast13, setForecast13] = useState<any>(null);
  const [forecast30, setForecast30] = useState<any>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"13-week" | "30-day" | "accounts" | "calendar" | "risk">("13-week");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [posRes, f13Res, f30Res, calRes] = await Promise.all([
        fetch("/api/finance/treasury/position"),
        fetch("/api/finance/treasury/forecast?mode=13-week"),
        fetch("/api/finance/treasury/forecast?mode=30-day"),
        fetch("/api/finance/treasury/forecast?mode=calendar"),
      ]);

      const pos = await posRes.json();
      const f13 = await f13Res.json();
      const f30 = await f30Res.json();
      const cal = await calRes.json();

      if (pos.success) setPositionData(pos);
      if (f13.success) setForecast13(f13);
      if (f30.success) setForecast30(f30);
      if (cal.success) setCalendarEvents(cal.events || []);
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดข้อมูล Treasury & Cash Forecast ได้",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const kpi = positionData?.position?.kpi || {
    totalCash: 0,
    bankBalance: 0,
    reconciledCash: 0,
    availableCash: 0,
    expectedInflow7Days: 0,
    expectedOutflow7Days: 0,
    net7Days: 0,
    projectedCash30Days: 0,
  };

  const accounts = positionData?.position?.accounts || [];
  const liquidity = positionData?.liquidity || { status: "HEALTHY", alerts: [] };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 space-y-6 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
              Phase 21 — Treasury Intelligence
            </span>
            <span className="text-xs text-slate-500">Live Cash Position</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 flex items-center gap-2.5">
            <Landmark className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            บริหารสภาพคล่องและกระแสเงินสด (Treasury Management)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ศูนย์วิเคราะห์สถานะเงินสดคงเหลือจริง การกระทบยอด และประมาณการกระแสเงินสด 13 สัปดาห์ล่วงหน้า
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรชข้อมูล
          </button>
          <a
            href="/admin/finance/reconciliation"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
          >
            ไปหน้ากระทบยอดธนาคาร
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Liquidity Status Banner */}
      {liquidity.alerts && liquidity.alerts.length > 0 && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
            liquidity.status === "CRITICAL"
              ? "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 text-rose-900 dark:text-rose-200"
              : "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 text-amber-900 dark:text-amber-200"
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <span className="font-bold">แจ้งเตือนความเสี่ยงสภาพคล่อง: </span>
            {liquidity.alerts[0].title} — {liquidity.alerts[0].description} (แนะนำ: {liquidity.alerts[0].suggestedAction})
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Ledger Cash */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>ยอดเงินตามระบบ (Cash Ledger)</span>
            <Wallet className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2 text-slate-900 dark:text-white">
            ฿{kpi.totalCash.toLocaleString()}
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-500">
            <span>กระทบยอดแล้ว (Reconciled):</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              ฿{kpi.reconciledCash.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Available Cash */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>เงินสดพร้อมใช้ (Available Cash)</span>
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2 text-emerald-600 dark:text-emerald-400">
            ฿{kpi.availableCash.toLocaleString()}
          </div>
          <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-500">
            <span>หักผูกพันรอจ่าย (Committed):</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              ฿{kpi.committedOutflow?.toLocaleString() || 0}
            </span>
          </div>
        </div>

        {/* 7-Day Net Cash Flow */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>กระแสเงินสดสุทธิ 7 วันข้างหน้า</span>
            {kpi.net7Days >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div
            className={`text-2xl md:text-3xl font-bold mt-2 ${
              kpi.net7Days >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {kpi.net7Days >= 0 ? "+" : ""}฿{kpi.net7Days.toLocaleString()}
          </div>
          <div className="mt-2 text-xs flex items-center justify-between text-slate-500">
            <span className="flex items-center text-emerald-600 gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" /> เข้า ฿{kpi.expectedInflow7Days.toLocaleString()}
            </span>
            <span className="flex items-center text-rose-600 gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> ออก ฿{kpi.expectedOutflow7Days.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Projected 30 Days */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 text-sm font-medium">
            <span>คาดการณ์คงเหลือ 30 วัน</span>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl md:text-3xl font-bold mt-2 text-blue-600 dark:text-blue-400">
            ฿{kpi.projectedCash30Days.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            ประเมินจากแนวโน้มรายรับ-รายจ่ายดำเนินงาน
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("13-week")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "13-week"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          ประมาณการ 13 สัปดาห์ (13-Week Rolling Forecast)
        </button>
        <button
          onClick={() => setActiveTab("30-day")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "30-day"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          ประมาณการรายวัน 30 วัน (Daily Projection)
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "accounts"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          สถานะรายบัญชีธนาคาร (Bank Accounts)
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === "calendar"
              ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
              : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          ปฏิทินการเงิน (Payment & Collection Calendar)
        </button>
      </div>

      {/* Tab 1: 13-Week Forecast Table */}
      {activeTab === "13-week" && forecast13 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="font-bold text-base">13-Week Rolling Cash Flow Forecast</h2>
              <p className="text-xs text-slate-500">
                คาดการณ์เงินสดรับเข้า-จ่ายออกแยกตามหมวดหมู่ ความเชื่อมั่น (Confidence) และยอดเงินคงเหลือปลายสัปดาห์
              </p>
            </div>
            <div className="text-xs text-slate-500">
              เงินสดต่ำสุดในรอบ 13 สัปดาห์:{" "}
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ฿{forecast13.minimumProjectedCash?.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">สัปดาห์</th>
                  <th className="py-3 px-4">ช่วงวันที่</th>
                  <th className="py-3 px-4 text-right">เงินต้นสัปดาห์</th>
                  <th className="py-3 px-4 text-right">เงินเข้ารวม (Inflows)</th>
                  <th className="py-3 px-4 text-right">เงินออกรวม (Outflows)</th>
                  <th className="py-3 px-4 text-right">สุทธิ (Net)</th>
                  <th className="py-3 px-4 text-right">เงินปลายสัปดาห์</th>
                  <th className="py-3 px-4 text-center">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {forecast13.forecastWeeks?.map((w: any) => (
                  <tr key={w.weekNumber} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold">W{w.weekNumber}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {w.startDate} ถึง {w.endDate}
                    </td>
                    <td className="py-3.5 px-4 text-right">฿{w.openingCash.toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right text-emerald-600 dark:text-emerald-400">
                      +฿{w.expectedInflows.total.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right text-rose-600 dark:text-rose-400">
                      -฿{w.expectedOutflows.total.toLocaleString()}
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold ${
                        w.netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {w.netCashFlow >= 0 ? "+" : ""}฿{w.netCashFlow.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 dark:text-white">
                      ฿{w.closingCash.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          w.confidence === "HIGH"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : w.confidence === "MEDIUM"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {w.confidence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: 30-Day Daily Projection */}
      {activeTab === "30-day" && forecast30 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-base">30-Day Daily Cash Position Trend</h2>
            <p className="text-xs text-slate-500">แนวโน้มการเปลี่ยนแปลงของสภาพคล่องรายวัน</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {forecast30.dailyPoints?.map((d: any, idx: number) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs"
              >
                <div className="font-semibold text-slate-600 dark:text-slate-400">{d.date}</div>
                <div className="mt-1 font-bold text-sm text-slate-900 dark:text-white">
                  ฿{d.closingCash.toLocaleString()}
                </div>
                <div className="mt-1 text-[11px] flex justify-between text-slate-500">
                  <span className="text-emerald-600">+{d.inflow / 1000}k</span>
                  <span className="text-rose-600">-{d.outflow / 1000}k</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Account Positions */}
      {activeTab === "accounts" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-base">สถานะเงินสดแยกรายบัญชีธนาคาร (Account Cash Positions)</h2>
            <p className="text-xs text-slate-500">
              เปรียบเทียบยอดตาม Cash Ledger กับยอด Statement ธนาคารล่าสุด และยอดที่กระทบยอดเสร็จสิ้น
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {accounts.map((acc: any) => {
              const diff = Math.abs(acc.ledgerBalance - acc.lastBankBalance);
              return (
                <div key={acc.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                      {acc.bankCode}
                    </div>
                    <div>
                      <div className="font-bold text-sm flex items-center gap-2">
                        {acc.accountName}
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {acc.accountType}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        เลขที่บัญชี: {acc.maskedAccountNo} | รหัส: {acc.accountCode}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-right">
                    <div>
                      <div className="text-slate-500">ยอดตามระบบ (Ledger)</div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        ฿{acc.ledgerBalance.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">ยอด Statement ล่าสุด</div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        ฿{acc.lastBankBalance.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">กระทบยอดแล้ว</div>
                      <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        ฿{acc.reconciledBalance.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">ผลต่าง (Diff)</div>
                      <div
                        className={`font-bold text-sm ${
                          diff === 0 ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        ฿{diff.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Calendar */}
      {activeTab === "calendar" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-base">ปฏิทินการเงิน (Payment & Collection Calendar)</h2>
              <p className="text-xs text-slate-500">
                กำหนดการจ่ายเงินและรับชำระเงินที่ยืนยันหรือคาดการณ์ไว้ในรอบเดือน
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800">
              {new Date().toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
            </span>
          </div>

          <div className="space-y-2.5">
            {calendarEvents.map((ev: any) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      ev.direction === "INFLOW"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}
                  >
                    {ev.direction === "INFLOW" ? "+" : "-"}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{ev.title}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                      <span>วันที่: {ev.date}</span>
                      <span>•</span>
                      <span>ประเภท: {ev.type}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-bold text-sm ${
                      ev.direction === "INFLOW"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {ev.direction === "INFLOW" ? "+" : "-"}฿{ev.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">{ev.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
