"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Eye,
  AlertCircle,
  TrendingDown,
  Activity,
} from "lucide-react";

export default function QHSEDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [capas, setCapas] = useState<any[]>([]);
  const [findings, setFindings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "incidents" | "capa" | "findings">("overview");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [kpiRes, incRes, capaRes, findRes] = await Promise.all([
        fetch("/api/qhse/kpi"),
        fetch("/api/qhse/incidents?take=10"),
        fetch("/api/qhse/capa?take=10"),
        fetch("/api/qhse/findings?take=10"),
      ]);

      const [kpiJson, incJson, capaJson, findJson] = await Promise.all([
        kpiRes.json(),
        incRes.json(),
        capaRes.json(),
        findRes.json(),
      ]);

      setData(kpiJson);
      setIncidents(incJson.items || []);
      setCapas(capaJson.items || []);
      setFindings(findJson.items || []);
    } catch (err) {
      console.error("Failed to load QHSE dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  const metrics = data?.metrics;
  const predictiveAlerts = data?.predictiveAlerts || [];
  const repeatFindings = data?.repeatFindings || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                ศูนย์บัญชาการความปลอดภัยและมาตรฐาน QHSE
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Quality, Health, Safety, Environment, Compliance & Risk Intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            รีเฟรชข้อมูล
          </button>
          <a
            href="/mobile/safety"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            รายงานเหตุการณ์ / Near Miss
          </a>
        </div>
      </div>

      {/* Predictive Alerts Banner */}
      {predictiveAlerts.length > 0 && (
        <div className="space-y-3">
          {predictiveAlerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${
                alert.severity === "CRITICAL"
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 text-red-900 dark:text-red-200"
                  : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200"
              }`}
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <div className="font-semibold text-sm">{alert.title}</div>
                <div className="text-xs mt-0.5 opacity-90">{alert.description}</div>
                <div className="mt-2 text-xs font-medium bg-white/70 dark:bg-black/30 inline-block px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800/40">
                  คำแนะนำ: {alert.recommendedAction}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Open Incidents */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>อุบัติการณ์ค้าง</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">
            {metrics?.safety?.openIncidents || 0}
          </div>
          <div className="text-xs text-red-600 font-medium mt-1">
            วิกฤติ {metrics?.safety?.criticalIncidents || 0} รายการ
          </div>
        </div>

        {/* Near Miss */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Near Miss (เกือบเกิดเหตุ)</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">
            {metrics?.safety?.nearMisses || 0}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            รายงานเชิงป้องกัน
          </div>
        </div>

        {/* Overdue CAPA */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>CAPA เกินกำหนด</span>
            <Clock className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-red-600 dark:text-red-400">
            {metrics?.quality?.overdueCAPA || 0}
          </div>
          <div className="text-xs text-amber-600 font-medium mt-1">
            ครบกำหนดเร็วๆ นี้ {metrics?.quality?.dueSoonCAPA || 0}
          </div>
        </div>

        {/* Open Findings */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>Finding & NCR ค้าง</span>
            <FileCheck2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">
            {metrics?.safety?.openFindings || 0}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">
            Major {metrics?.quality?.majorFindings || 0} รายการ
          </div>
        </div>

        {/* High Risks */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>ความเสี่ยงระดับสูง</span>
            <TrendingDown className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">
            {(metrics?.risk?.criticalRisks || 0) + (metrics?.risk?.highRisks || 0)}
          </div>
          <div className="text-xs text-purple-600 font-medium mt-1">
            Critical {metrics?.risk?.criticalRisks || 0} / Active {metrics?.risk?.totalActiveRisks || 0}
          </div>
        </div>

        {/* Expiring Certs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
            <span>ใบรับรองใกล้หมดอายุ</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-slate-900 dark:text-slate-100">
            {metrics?.training?.expiringCertificates || 0}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-1">
            หมดอายุแล้ว {metrics?.training?.expiredCertificates || 0} คน
          </div>
        </div>
      </div>

      {/* Repeat Findings Alert */}
      {repeatFindings.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              ตรวจพบประเด็นซ้ำซาก (Repeat Findings Pattern): {repeatFindings.length} รูปแบบ
            </div>
            <div className="mt-1 text-xs text-blue-700 dark:text-blue-300">
              ระบบตรวจสอบประเด็นที่เกิดขึ้นซ้ำ &ge; 2 ครั้งในรอบ 90 วัน เพื่อให้ผู้บริหารพิจารณาแนวทางแก้ไขระดับกระบวนการเชิงระบบ (Systemic CAPA) แทนการแก้ไขรายจุด
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {repeatFindings.map((rf: any, i: number) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700 font-medium text-blue-800 dark:text-blue-200"
                >
                  "{rf.pattern}" ({rf.occurrences} ครั้ง)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            ภาพรวม QHSE
          </button>
          <button
            onClick={() => setActiveTab("incidents")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "incidents"
                ? "border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            อุบัติการณ์ & Near Miss ({incidents.length})
          </button>
          <button
            onClick={() => setActiveTab("capa")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "capa"
                ? "border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            มาตรการ CAPA ({capas.length})
          </button>
          <button
            onClick={() => setActiveTab("findings")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "findings"
                ? "border-red-600 text-red-600 dark:border-red-400 dark:text-red-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            ข้อบกพร่อง & NCR ({findings.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Incidents Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                อุบัติการณ์ล่าสุด
              </h2>
              <button
                onClick={() => setActiveTab("incidents")}
                className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline"
              >
                ดูทั้งหมด
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                    <th className="py-2">เลขที่</th>
                    <th>ประเภท</th>
                    <th>ความรุนแรง</th>
                    <th>สถานที่</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {incidents.slice(0, 5).map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                      <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        {inc.incidentNo}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {inc.incidentType}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`px-2 py-0.5 rounded-full font-semibold ${
                            inc.severity === "CRITICAL"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              : inc.severity === "HIGH"
                              ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                        {inc.location}
                      </td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                          {inc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {incidents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">
                        ไม่มีอุบัติการณ์ที่เปิดอยู่
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Urgent CAPAs Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                มาตรการแก้ไขและป้องกัน (CAPA) เร่งด่วน
              </h2>
              <button
                onClick={() => setActiveTab("capa")}
                className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline"
              >
                ดูทั้งหมด
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                    <th className="py-2">เลขที่</th>
                    <th>หัวข้อมาตรการ</th>
                    <th>ประเภท</th>
                    <th>ครบกำหนด</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {capas.slice(0, 5).map((c) => {
                    const isOverdue = new Date(c.dueDate) < new Date() && c.status !== "CLOSED";
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                        <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                          {c.capaNo}
                        </td>
                        <td className="text-slate-700 dark:text-slate-300 max-w-[140px] truncate font-medium">
                          {c.title}
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {c.actionType}
                          </span>
                        </td>
                        <td>
                          <span className={isOverdue ? "text-red-600 font-bold" : "text-slate-500"}>
                            {new Date(c.dueDate).toLocaleDateString("th-TH")}
                          </span>
                        </td>
                        <td>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {capas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">
                        ไม่มีมาตรการ CAPA ที่ค้างอยู่
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Incidents Tab */}
      {activeTab === "incidents" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ทะเบียนอุบัติการณ์ทั้งหมด ({incidents.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                  <th className="py-3">เลขที่</th>
                  <th>วันที่เกิดเหตุ</th>
                  <th>ประเภท</th>
                  <th>ความรุนแรง</th>
                  <th>สถานที่</th>
                  <th>รายละเอียด</th>
                  <th>มาตรการฉุกเฉิน</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">{inc.incidentNo}</td>
                    <td className="text-slate-500">
                      {new Date(inc.occurredAt).toLocaleString("th-TH")}
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {inc.incidentType}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          inc.severity === "CRITICAL"
                            ? "bg-red-100 text-red-700"
                            : inc.severity === "HIGH"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="font-medium text-slate-700 dark:text-slate-300">{inc.location}</td>
                    <td className="max-w-[200px] truncate text-slate-600 dark:text-slate-400">{inc.description}</td>
                    <td>
                      {inc.immediateAction ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-medium">
                          {inc.immediateAction}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold">
                        {inc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CAPA Tab */}
      {activeTab === "capa" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ทะเบียนมาตรการแก้ไขและป้องกัน (CAPA Register)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                  <th className="py-3">เลขที่ CAPA</th>
                  <th>หัวข้อมาตรการ</th>
                  <th>ประเภท</th>
                  <th>ความสำคัญ</th>
                  <th>ผู้รับผิดชอบ</th>
                  <th>วันครบกำหนด</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                {capas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">{c.capaNo}</td>
                    <td className="font-medium text-slate-800 dark:text-slate-200">{c.title}</td>
                    <td>{c.actionType}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          c.priority === "URGENT" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">{c.ownerId}</td>
                    <td>{new Date(c.dueDate).toLocaleDateString("th-TH")}</td>
                    <td>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Findings Tab */}
      {activeTab === "findings" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              ข้อบกพร่องและการตรวจพบ (Findings & Non-Conformance)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                  <th className="py-3">เลขที่</th>
                  <th>หัวข้อ</th>
                  <th>ที่มา</th>
                  <th>ระดับความร้ายแรง</th>
                  <th>ผู้รับผิดชอบ</th>
                  <th>ครบกำหนด</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs">
                {findings.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">{f.findingNo}</td>
                    <td className="font-medium text-slate-800 dark:text-slate-200">{f.title}</td>
                    <td>{f.source}</td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded-full font-medium ${
                          f.classification === "CRITICAL"
                            ? "bg-red-100 text-red-700"
                            : f.classification === "MAJOR"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {f.classification}
                      </span>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">{f.ownerId}</td>
                    <td>{new Date(f.dueDate).toLocaleDateString("th-TH")}</td>
                    <td>
                      <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                        {f.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
