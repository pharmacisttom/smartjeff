"use client";

import React, { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  Users,
  Clock,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { SiteOperationalData } from "./ExecutiveSiteMap";

interface ExecutiveReportsProps {
  sites: SiteOperationalData[];
  reliefList: Array<{
    id: string;
    employeeName: string;
    position: string;
    homeSite: string;
    targetSite: string;
    workHours: number;
    otHours: number;
    date: any;
  }>;
  recentAnomalies: Array<{
    id: string;
    employeeName: string;
    code: string;
    distance: number;
    timestamp: string;
    type: string;
  }>;
  onSelectSite?: (site: SiteOperationalData) => void;
}

export function ExecutiveReports({
  sites,
  reliefList,
  recentAnomalies,
  onSelectSite,
}: ExecutiveReportsProps) {
  const [activeReportTab, setActiveReportTab] = useState<"sites" | "relief" | "anomalies">("sites");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEstate, setSelectedEstate] = useState("ALL");
  const [sortField, setSortField] = useState<"code" | "headcount" | "rate" | "cost">("rate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const estates = ["ALL", ...Array.from(new Set(sites.map((s) => s.estateName).filter(Boolean)))];

  // Filtering & Sorting Sites
  const filteredSites = sites
    .filter((site) => {
      const matchSearch =
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.estateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.contactName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchEstate = selectedEstate === "ALL" || site.estateName === selectedEstate;
      return matchSearch && matchEstate;
    })
    .sort((a, b) => {
      let result = 0;
      if (sortField === "code") result = a.code.localeCompare(b.code);
      else if (sortField === "headcount") result = a.actualOnDuty - b.actualOnDuty;
      else if (sortField === "rate") result = a.attendanceRate - b.attendanceRate;
      else if (sortField === "cost") result = a.laborCost - b.laborCost;
      return sortOrder === "desc" ? -result : result;
    });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "รหัสไซต์",
      "ชื่อไซต์งาน",
      "นิคมอุตสาหกรรม/พื้นที่",
      "เป้าหมายกำลังพล (คน)",
      "ปฏิบัติงานจริง (คน)",
      "อัตราเข้างาน (%)",
      "พนักงานเสริม (คน)",
      "แจ้งเตือน Geofence (ครั้ง)",
      "เวลาทำงาน",
      "ผู้ประสานงาน",
      "เบอร์โทร",
      "ค่าแรงประมาณการ (บาท)",
    ];

    const rows = filteredSites.map((s) => [
      `"${s.code}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.estateName}"`,
      s.targetHeadcount,
      s.actualOnDuty,
      `${s.attendanceRate}%`,
      s.reliefCount,
      s.outsideGeofenceCount,
      `"${s.workHours}"`,
      `"${s.contactName}"`,
      `"${s.contactPhone}"`,
      s.laborCost,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Executive_Operations_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-6">
      {/* Report Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-brand-600" />
            <h3 className="font-black text-base text-content-primary">
              รายงานผลการปฏิบัติงานภาคสนาม (Executive Operations Reports)
            </h3>
          </div>
          <p className="text-xs text-content-muted mt-0.5">
            สรุปข้อมูลสถิติรายไซต์ การกระจายกำลังพล และรายงานความผิดปกติเพื่อการตัดสินใจของผู้บริหาร
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center bg-surface-subtle p-1 rounded-2xl border border-surface-border text-xs font-bold">
            <button
              onClick={() => setActiveReportTab("sites")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeReportTab === "sites" ? "bg-brand-600 text-white shadow-sm" : "text-content-secondary hover:text-content-primary"
              }`}
            >
              สรุปรายจุดปฏิบัติงาน ({sites.length})
            </button>
            <button
              onClick={() => setActiveReportTab("relief")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeReportTab === "relief" ? "bg-brand-600 text-white shadow-sm" : "text-content-secondary hover:text-content-primary"
              }`}
            >
              กำลังพลเสริมข้ามไซต์ ({reliefList.length})
            </button>
            <button
              onClick={() => setActiveReportTab("anomalies")}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeReportTab === "anomalies" ? "bg-brand-600 text-white shadow-sm" : "text-content-secondary hover:text-content-primary"
              }`}
            >
              เตือนความผิดปกติ ({recentAnomalies.length})
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-surface-subtle hover:bg-surface-subtle/80 text-content-primary border border-surface-border text-xs font-bold transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์รายงาน</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Sites Operational Summary */}
      {activeReportTab === "sites" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อไซต์ / รหัส / ผู้ดูแล..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs w-56"
                />
              </div>

              <select
                value={selectedEstate}
                onChange={(e) => setSelectedEstate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface-subtle border border-surface-border text-content-primary focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs cursor-pointer font-medium"
              >
                <option value="ALL">นิคมฯ ทั้งหมด</option>
                {estates
                  .filter((e) => e !== "ALL")
                  .map((est) => (
                    <option key={est} value={est}>
                      {est}
                    </option>
                  ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center space-x-2 font-medium text-content-secondary">
              <span>เรียงตาม:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="px-2.5 py-1 rounded-xl bg-surface-subtle border border-surface-border text-content-primary text-xs cursor-pointer"
              >
                <option value="rate">อัตราเข้างาน (%)</option>
                <option value="headcount">จำนวนคนปฏิบัติงาน</option>
                <option value="cost">ค่าแรงรวม</option>
                <option value="code">รหัสไซต์</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-1.5 rounded-lg bg-surface-subtle border border-surface-border hover:bg-surface-subtle/80 text-content-primary font-bold"
              >
                {sortOrder === "desc" ? "↓ มากไปน้อย" : "↑ น้อยไปมาก"}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-surface-border rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold border-b border-surface-border">
                <tr>
                  <th className="p-3">รหัส & ชื่อไซต์งาน</th>
                  <th className="p-3">นิคมฯ / ทำเล</th>
                  <th className="p-3 text-center">เป้าหมาย</th>
                  <th className="p-3 text-center">เข้างานจริง</th>
                  <th className="p-3 text-center">อัตราเข้างาน</th>
                  <th className="p-3 text-center">เสริม / นอกเขต</th>
                  <th className="p-3">ช่วงเวลากะ</th>
                  <th className="p-3">ผู้ติดต่อหน้างาน</th>
                  <th className="p-3 text-right">ค่าแรงประมาณการ</th>
                  <th className="p-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredSites.map((site) => (
                  <tr
                    key={site.id}
                    onClick={() => onSelectSite && onSelectSite(site)}
                    className="hover:bg-surface-subtle/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-3">
                      <div className="font-black text-content-primary group-hover:text-brand-600 transition-colors">
                        {site.code}
                      </div>
                      <div className="text-[11px] text-content-secondary line-clamp-1 max-w-[200px]">{site.name}</div>
                    </td>
                    <td className="p-3 text-content-secondary max-w-[140px] truncate">{site.estateName}</td>
                    <td className="p-3 text-center font-bold text-content-primary">{site.targetHeadcount} คน</td>
                    <td className="p-3 text-center font-black text-brand-600">{site.actualOnDuty} คน</td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center">
                        <span
                          className={`font-black ${
                            site.attendanceRate >= 95
                              ? "text-emerald-600"
                              : site.attendanceRate >= 80
                              ? "text-amber-600"
                              : "text-rose-600"
                          }`}
                        >
                          {site.attendanceRate}%
                        </span>
                        <div className="w-16 h-1.5 bg-surface-subtle rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              site.attendanceRate >= 95
                                ? "bg-emerald-500"
                                : site.attendanceRate >= 80
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                            style={{ width: `${site.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1 text-[11px]">
                        {site.reliefCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-bold">
                            +{site.reliefCount} เสริม
                          </span>
                        )}
                        {site.outsideGeofenceCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold">
                            ! {site.outsideGeofenceCount} นอกเขต
                          </span>
                        )}
                        {site.reliefCount === 0 && site.outsideGeofenceCount === 0 && (
                          <span className="text-content-muted">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-content-secondary whitespace-nowrap">{site.workHours}</td>
                    <td className="p-3">
                      <div className="font-bold text-content-primary">{site.contactName}</div>
                      <div className="text-[10px] text-content-muted">{site.contactPhone}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-content-primary">
                      ฿{site.laborCost.toLocaleString("th-TH")}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          site.status === "ALERT"
                            ? "bg-rose-500/10 text-rose-600"
                            : site.status === "WARNING"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-emerald-500/10 text-emerald-600"
                        }`}
                      >
                        {site.status === "ALERT" ? "เตือนภัย" : site.status === "WARNING" ? "เฝ้าระวัง" : "ปกติ"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Relief Workers Deployment */}
      {activeReportTab === "relief" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300">
            <strong>นโยบายการกระจายกำลังพลเสริม (Cross-Site Relief):</strong>{" "}
            เมื่อไซต์งานมีอัตรากำลังพลขาดแคลนหรือมีพนักงานลางานกระทันหัน
            ระบบจะบันทึกการส่งพนักงานข้ามไซต์เพื่อรักษามาตรฐานการให้บริการ (SLA)
          </div>

          <div className="overflow-x-auto border border-surface-border rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold border-b border-surface-border">
                <tr>
                  <th className="p-3">พนักงานเสริม</th>
                  <th className="p-3">ตำแหน่ง</th>
                  <th className="p-3">ไซต์ต้นทาง (Home Site)</th>
                  <th className="p-3">ไซต์ที่ไปช่วยปฏิบัติงาน</th>
                  <th className="p-3 text-center">ชั่วโมงทำงาน</th>
                  <th className="p-3 text-center">ชั่วโมง OT</th>
                  <th className="p-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {reliefList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-content-muted">
                      ไม่มีรายการส่งพนักงานเสริมในขณะนี้
                    </td>
                  </tr>
                ) : (
                  reliefList.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="p-3 font-bold text-content-primary">{r.employeeName}</td>
                      <td className="p-3 text-content-secondary">{r.position}</td>
                      <td className="p-3 text-content-muted">{r.homeSite}</td>
                      <td className="p-3 font-bold text-brand-600 flex items-center space-x-1.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                        <span>{r.targetSite}</span>
                      </td>
                      <td className="p-3 text-center font-bold text-content-primary">{r.workHours} ชม.</td>
                      <td className="p-3 text-center font-bold text-indigo-600">{r.otHours} ชม.</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">
                          ปฏิบัติงานข้ามไซต์
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Field Anomaly & Incident Log */}
      {activeReportTab === "anomalies" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
            <strong>ระบบเฝ้าระวัง Geofencing & Fraud Prevention:</strong>{" "}
            ตรวจพบพนักงานที่ลงเวลาห่างจากจุดศูนย์กลางเกินรัศมีที่กำหนด เพื่อให้ผู้บริหารตรวจสอบและสั่งการแก้ไข
          </div>

          <div className="overflow-x-auto border border-surface-border rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold border-b border-surface-border">
                <tr>
                  <th className="p-3">รหัส / พนักงาน</th>
                  <th className="p-3">ประเภทบันทึก</th>
                  <th className="p-3">เวลาที่ตรวจพบ</th>
                  <th className="p-3 text-center">ระยะห่างจาก Geofence</th>
                  <th className="p-3 text-center">ระดับความเสี่ยง</th>
                  <th className="p-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {recentAnomalies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-content-muted">
                      ไม่มีรายการแจ้งเตือนความผิดปกติในวันนี้ การลงเวลาอยู่ในรัศมี 100%
                    </td>
                  </tr>
                ) : (
                  recentAnomalies.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="p-3 font-bold text-content-primary">
                        {a.employeeName}
                        <span className="block text-[10px] text-content-muted">{a.code}</span>
                      </td>
                      <td className="p-3 font-semibold text-content-secondary">{a.type}</td>
                      <td className="p-3 text-content-muted">{a.timestamp}</td>
                      <td className="p-3 text-center font-black text-rose-600">+{a.distance} เมตร</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600">
                          นอกพื้นที่อนุญาต
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button className="px-2.5 py-1 rounded-xl bg-surface-subtle hover:bg-surface-subtle/80 text-content-primary font-bold text-[11px] border border-surface-border">
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
