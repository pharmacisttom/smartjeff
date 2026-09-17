"use client";

import { useState, useEffect } from "react";
import { FileCheck2, AlertCircle, RefreshCw, CheckCircle2, ShieldAlert, Award } from "lucide-react";

export default function ComplianceDashboardPage() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, gapRes, certRes] = await Promise.all([
        fetch("/api/compliance?take=50"),
        fetch("/api/compliance?gaps=true"),
        fetch("/api/training?expiringDays=60"),
      ]);
      const [reqJson, gapJson, certJson] = await Promise.all([
        reqRes.json(),
        gapRes.json(),
        certRes.json(),
      ]);

      setRequirements(reqJson.items || []);
      setGaps(gapJson.gaps || []);
      setCerts(certJson.expiring || []);
    } catch (err) {
      console.error("Failed to load compliance data", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <FileCheck2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                ทะเบียนการปฏิบัติตามกฎหมายและข้อกำหนด (Compliance & Standards)
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Legal, Client, Contract, Safety, Environment, Licensing & Training Compliance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">ข้อกำหนดทั้งหมด (Requirements)</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{requirements.length}</div>
            <div className="text-xs text-emerald-600 font-medium">สอดคล้องตามเกณฑ์</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">ช่องว่างความสอดคล้อง (Compliance Gaps)</div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{gaps.length}</div>
            <div className="text-xs text-red-600 font-medium">ต้องดำเนินการแก้ไข</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500">ใบรับรองใกล้หมดอายุ (ภายใน 60 วัน)</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{certs.length}</div>
            <div className="text-xs text-amber-600 font-medium">ต้องต่ออายุหรืออบรมเพิ่ม</div>
          </div>
        </div>
      </div>

      {/* Compliance Gaps Table */}
      {gaps.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              ช่องว่างความสอดคล้องที่ต้องแก้ไข (Active Compliance Gaps)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                  <th className="py-2.5">ข้อกำหนด</th>
                  <th>หน่วยงาน / เอนทิตี</th>
                  <th>รายละเอียดช่องว่าง (Gap)</th>
                  <th>ระดับความรุนแรง</th>
                  <th>ผู้รับผิดชอบ</th>
                  <th>กำหนดแก้ไข</th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {gaps.map((gap) => (
                  <tr key={gap.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                      {gap.requirement?.code} - {gap.requirement?.title}
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {gap.entityType}: {gap.entityId}
                      </span>
                    </td>
                    <td className="text-slate-700 dark:text-slate-300 max-w-[220px] truncate font-medium">
                      {gap.gapDescription}
                    </td>
                    <td>
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          gap.severity === "CRITICAL"
                            ? "bg-red-100 text-red-700"
                            : gap.severity === "HIGH"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {gap.severity}
                      </span>
                    </td>
                    <td className="text-slate-600 dark:text-slate-300">{gap.ownerId}</td>
                    <td>{new Date(gap.dueDate).toLocaleDateString("th-TH")}</td>
                    <td>
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                        {gap.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compliance Register Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-500" />
            ทะเบียนข้อกำหนดกฎหมายและมาตรฐาน (Compliance Register)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                <th className="py-3">รหัส</th>
                <th>ชื่อข้อกำหนด</th>
                <th>หมวดหมู่</th>
                <th>ขอบเขต (Scope)</th>
                <th>รอบการตรวจ</th>
                <th>วันหมดอายุ</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {requirements.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                  <td className="py-3 font-semibold text-slate-900 dark:text-slate-100">{req.code}</td>
                  <td className="font-medium text-slate-800 dark:text-slate-200 max-w-[240px] truncate">
                    {req.title}
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {req.category}
                    </span>
                  </td>
                  <td>{req.scope}</td>
                  <td>{req.reviewFrequency}</td>
                  <td className="text-slate-500">
                    {req.expiryDate ? new Date(req.expiryDate).toLocaleDateString("th-TH") : "-"}
                  </td>
                  <td>
                    <span
                      className={`px-2.5 py-1 rounded-full font-semibold ${
                        req.status === "COMPLIANT"
                          ? "bg-emerald-50 text-emerald-700"
                          : req.status === "NON_COMPLIANT"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
              {requirements.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400">
                    ยังไม่มีข้อกำหนดในทะเบียน
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
