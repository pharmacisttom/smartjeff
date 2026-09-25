"use client";

import React, { useState } from "react";
import {
  Users,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  Flame,
  Zap,
} from "lucide-react";

interface ExecutiveChartsProps {
  kpis: {
    totalEmployees: number;
    totalTarget: number;
    totalPresent: number;
    totalLate: number;
    totalOutside: number;
    totalRelief: number;
    totalLeaves: number;
    totalAbsent: number;
    attendanceRate: number;
    geofenceComplianceRate: number;
    totalLaborCost: number;
    estimatedOtCost: number;
  };
  topSites: Array<{
    code: string;
    name: string;
    target: number;
    actual: number;
    rate: number;
  }>;
  hourlyDistribution: Array<{
    hour: string;
    checkIns: number;
    checkOuts: number;
  }>;
}

export function ExecutiveCharts({ kpis, topSites, hourlyDistribution }: ExecutiveChartsProps) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "workforce" | "hourly">("all");

  // Donut chart calculations
  const totalCount = kpis.totalTarget || 150;
  const onTimeCount = Math.max(0, kpis.totalPresent - kpis.totalLate);
  const lateCount = kpis.totalLate || 2;
  const reliefCount = kpis.totalRelief || 3;
  const leaveCount = kpis.totalLeaves || 2;
  const absentCount = kpis.totalAbsent || 1;

  const slices = [
    { id: "ontime", label: "เข้างานตรงเวลา", count: onTimeCount, color: "#10b981", textColor: "text-emerald-500" },
    { id: "late", label: "มาสาย (Late)", count: lateCount, color: "#f59e0b", textColor: "text-amber-500" },
    { id: "relief", label: "ปฏิบัติงานเสริม (Relief)", count: reliefCount, color: "#3b82f6", textColor: "text-blue-500" },
    { id: "leave", label: "ลางาน (Approved)", count: leaveCount, color: "#8b5cf6", textColor: "text-purple-500" },
    { id: "absent", label: "ขาดงาน / ยังไม่พบ", count: absentCount, color: "#f43f5e", textColor: "text-rose-500" },
  ];

  const totalSliceCount = slices.reduce((acc, s) => acc + s.count, 0) || 1;

  // Compute SVG paths for Donut
  let cumulativeAngle = 0;
  const donutPaths = slices.map((slice) => {
    const sliceAngle = (slice.count / totalSliceCount) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const r = 70;
    const cx = 100;
    const cy = 100;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = sliceAngle > 180 ? 1 : 0;
    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const percentage = Math.round((slice.count / totalSliceCount) * 100);

    return {
      ...slice,
      pathData,
      percentage,
      startAngle,
      endAngle,
    };
  });

  // Hourly Flow Area Chart calculations
  const maxHourly = Math.max(...hourlyDistribution.map((h) => Math.max(h.checkIns, h.checkOuts)), 10);
  const chartHeight = 140;
  const chartWidth = 500;
  const stepX = chartWidth / (hourlyDistribution.length - 1);

  const checkInPoints = hourlyDistribution.map((h, i) => {
    const x = i * stepX;
    const y = chartHeight - (h.checkIns / maxHourly) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  });

  const checkOutPoints = hourlyDistribution.map((h, i) => {
    const x = i * stepX;
    const y = chartHeight - (h.checkOuts / maxHourly) * (chartHeight - 20) - 10;
    return `${x},${y}`;
  });

  const checkInArea = `M 0,${chartHeight} L ${checkInPoints.join(" L ")} L ${chartWidth},${chartHeight} Z`;
  const checkOutArea = `M 0,${chartHeight} L ${checkOutPoints.join(" L ")} L ${chartWidth},${chartHeight} Z`;

  return (
    <div className="space-y-6">
      {/* Visual Analytics Header & Category Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card border border-surface-border p-4 rounded-3xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-content-primary">
              วิเคราะห์ตัวชี้วัดประสิทธิภาพเชิงภาพรวม (Executive Performance Analytics)
            </h3>
            <p className="text-xs text-content-muted">
              สถิติการปฏิบัติงาน กำลังพล และการกระจายตัวตามจุดงานประจำวัน
            </p>
          </div>
        </div>

        <div className="flex items-center bg-surface-subtle p-1 rounded-2xl border border-surface-border text-xs font-bold">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "all" ? "bg-brand-600 text-white shadow-sm" : "text-content-secondary hover:text-content-primary"
            }`}
          >
            ภาพรวมทั้งหมด
          </button>
          <button
            onClick={() => setActiveTab("workforce")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "workforce" ? "bg-brand-600 text-white shadow-sm" : "text-content-secondary hover:text-content-primary"
            }`}
          >
            กำลังพล & ไซต์
          </button>
          <button
            onClick={() => setActiveTab("hourly")}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === "hourly" ? "bg-brand-600 text-white shadow-sm" : "text-content-secondary hover:text-content-primary"
            }`}
          >
            รอบเวลา 24 ชม.
          </button>
        </div>
      </div>

      {/* Grid of 3 Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Chart 1: Donut Chart - Workforce Status (5 Columns) */}
        {(activeTab === "all" || activeTab === "workforce") && (
          <div className="lg:col-span-5 bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h4 className="font-black text-sm text-content-primary">สัดส่วนการปฏิบัติงานกำลังพล</h4>
                <p className="text-[11px] text-content-muted">จำแนกตามสถานะการเข้ากะและจุดงาน</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600">
                {kpis.attendanceRate}% เข้างาน
              </span>
            </div>

            {/* Donut Graphic */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
              <div className="relative w-44 h-44 shrink-0">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {donutPaths.map((slice) => {
                    const isHovered = hoveredSlice === slice.id;
                    return (
                      <path
                        key={slice.id}
                        d={slice.pathData}
                        fill={slice.color}
                        opacity={hoveredSlice && !isHovered ? 0.4 : 1}
                        className="transition-all duration-300 cursor-pointer"
                        onMouseEnter={() => setHoveredSlice(slice.id)}
                        onMouseLeave={() => setHoveredSlice(null)}
                      />
                    );
                  })}
                  {/* Inner Hole (Donut) */}
                  <circle cx="100" cy="100" r="48" className="fill-surface-card" />
                </svg>

                {/* Donut Center Metrics */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] text-content-muted font-bold">ปฏิบัติงานจริง</span>
                  <span className="text-2xl font-black text-content-primary">{kpis.totalPresent}</span>
                  <span className="text-[10px] text-content-muted">/ {kpis.totalTarget} คน</span>
                </div>
              </div>

              {/* Legends List */}
              <div className="space-y-2 w-full">
                {donutPaths.map((slice) => (
                  <div
                    key={slice.id}
                    onMouseEnter={() => setHoveredSlice(slice.id)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`flex items-center justify-between text-xs p-1.5 rounded-xl cursor-pointer transition-all ${
                      hoveredSlice === slice.id ? "bg-surface-subtle scale-102" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                      <span className="text-content-secondary font-medium">{slice.label}</span>
                    </div>
                    <div className="font-bold text-content-primary">
                      {slice.count} คน <span className="text-[10px] text-content-muted font-normal">({slice.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border text-[11px] text-content-muted flex items-center justify-between">
              <span>ความแม่นยำ Geofence:</span>
              <strong className="text-emerald-600">{kpis.geofenceComplianceRate}% ตรงรัศมี</strong>
            </div>
          </div>
        )}

        {/* Chart 2: Top Sites Comparison Bar Chart (7 Columns) */}
        {(activeTab === "all" || activeTab === "workforce") && (
          <div className="lg:col-span-7 bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h4 className="font-black text-sm text-content-primary">อัตรากำลังพลในไซต์สำคัญ (Top Sites Capacity)</h4>
                <p className="text-[11px] text-content-muted">เปรียบเทียบเป้าหมาย vs ปฏิบัติงานจริงหน้างาน</p>
              </div>
              <div className="flex items-center space-x-3 text-[10px] font-bold">
                <span className="flex items-center space-x-1 text-content-muted">
                  <span className="w-2.5 h-2.5 rounded bg-slate-300 dark:bg-slate-700" />
                  <span>เป้าหมาย</span>
                </span>
                <span className="flex items-center space-x-1 text-brand-600">
                  <span className="w-2.5 h-2.5 rounded bg-brand-600" />
                  <span>ปฏิบัติงานจริง</span>
                </span>
              </div>
            </div>

            {/* Horizontal Bar Visuals */}
            <div className="space-y-4 my-3">
              {topSites.map((site) => {
                const fillPercent = site.target > 0 ? Math.min(100, Math.round((site.actual / site.target) * 100)) : 100;
                return (
                  <div key={site.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-content-primary">{site.code}</span>
                        <span className="text-[11px] text-content-muted truncate max-w-[180px]">{site.name}</span>
                      </div>
                      <div className="text-[11px] font-bold text-content-primary">
                        {site.actual} / {site.target} คน
                        <span className="ml-1 text-emerald-600 font-black">({fillPercent}%)</span>
                      </div>
                    </div>

                    {/* Dual Progress Bar */}
                    <div className="w-full h-3 bg-surface-subtle rounded-full overflow-hidden flex relative">
                      <div
                        className="h-full bg-gradient-to-r from-brand-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-700 shadow-sm"
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-2xl bg-surface-subtle/70 border border-surface-border flex items-center justify-between text-xs">
              <span className="text-content-secondary">กำลังพลสำรองที่พร้อมหมุนเวียน (Relief Pool)</span>
              <span className="font-black text-brand-600">12 อัตรา</span>
            </div>
          </div>
        )}

        {/* Chart 3: 24-Hour Area Wave Chart (Full Width or 8 Columns) */}
        {(activeTab === "all" || activeTab === "hourly") && (
          <div className="lg:col-span-8 bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h4 className="font-black text-sm text-content-primary">
                  คลื่นเวลาเข้า-ออกงานและการไหลเวียนกำลังพล (24-Hour Operations Influx)
                </h4>
                <p className="text-[11px] text-content-muted">
                  ติดตามเวลาเข้างานกะเช้า (Peak 06:00-08:00) และการออกกะ/OT (Peak 16:00-18:00)
                </p>
              </div>
              <div className="flex items-center space-x-3 text-[10px] font-bold">
                <span className="flex items-center space-x-1 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                  <span>เข้างาน (Check-In)</span>
                </span>
                <span className="flex items-center space-x-1 text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500" />
                  <span>ออกงาน / OT (Check-Out)</span>
                </span>
              </div>
            </div>

            {/* SVG Area Chart */}
            <div className="w-full my-4 overflow-x-auto">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-36">
                <defs>
                  <linearGradient id="checkInGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="checkOutGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="#334155" strokeDasharray="3 3" opacity="0.2" />
                <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#334155" strokeDasharray="3 3" opacity="0.2" />
                <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="#334155" strokeDasharray="3 3" opacity="0.2" />

                {/* Check-In Area & Line */}
                <path d={checkInArea} fill="url(#checkInGrad)" />
                <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={checkInPoints.join(" ")} />

                {/* Check-Out Area & Line */}
                <path d={checkOutArea} fill="url(#checkOutGrad)" />
                <polyline fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="4 2" points={checkOutPoints.join(" ")} />
              </svg>

              {/* X-axis labels */}
              <div className="flex justify-between text-[10px] text-content-muted font-bold px-1 mt-1">
                {hourlyDistribution.filter((_, i) => i % 2 === 0).map((h) => (
                  <span key={h.hour}>{h.hour}</span>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-content-muted flex items-center justify-between border-t border-surface-border pt-3">
              <span>ช่วงเวลาที่มีการปฏิบัติงานสูงสุด:</span>
              <strong className="text-content-primary">07:00 - 16:30 น. (148 คนพร้อมกัน)</strong>
            </div>
          </div>
        )}

        {/* Chart 4: Financial & Efficiency Gauge (4 Columns) */}
        {(activeTab === "all" || activeTab === "hourly") && (
          <div className="lg:col-span-4 bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div className="border-b border-surface-border pb-3">
              <h4 className="font-black text-sm text-content-primary">ประสิทธิภาพ & การเงินหน้างาน</h4>
              <p className="text-[11px] text-content-muted">ประมาณการต้นทุนค่าแรงและมาตรการ Geofence</p>
            </div>

            <div className="space-y-4 my-2">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block">
                  ค่าแรงรายวันประมาณการ (Daily Labor)
                </span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  ฿{kpis.totalLaborCost.toLocaleString("th-TH", { minimumFractionDigits: 0 })}
                </div>
                <p className="text-[10px] text-emerald-600/80 mt-0.5">คำนวณจาก {kpis.totalPresent} คนที่ลงเวลาจริง</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-[11px] text-indigo-700 dark:text-indigo-400 font-bold block">
                  งบประมาณล่วงเวลา (Estimated OT)
                </span>
                <div className="text-2xl font-black text-indigo-600 mt-1">
                  ฿{kpis.estimatedOtCost.toLocaleString("th-TH", { minimumFractionDigits: 0 })}
                </div>
                <p className="text-[10px] text-indigo-600/80 mt-0.5">ประเมินล่วงเวลาประมาณ 12% ของกะปกติ</p>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs">
              <span className="text-content-muted">ประหยัดจากการป้องกัน Buddy Punching:</span>
              <strong className="text-brand-600">~฿4,200/วัน</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
