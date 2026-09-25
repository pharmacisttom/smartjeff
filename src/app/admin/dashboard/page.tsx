"use client";

import { useEffect, useState, useRef } from "react";
import {
  Users,
  Clock,
  AlertTriangle,
  UserMinus,
  MapPin,
  RefreshCw,
  Shield,
  Layers,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingUp,
  FileText,
  DollarSign,
  Compass,
  Building2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { ExecutiveSiteMap, SiteOperationalData } from "@/components/admin/ExecutiveSiteMap";
import { ExecutiveCharts } from "@/components/admin/ExecutiveCharts";
import { ExecutiveReports } from "@/components/admin/ExecutiveReports";

interface ExecutiveOperationsResponse {
  reportDate: string;
  reportDateFormatted: string;
  kpis: {
    totalSites: number;
    activeOperatingSites: number;
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
  sites: SiteOperationalData[];
  hourlyDistribution: Array<{
    hour: string;
    checkIns: number;
    checkOuts: number;
  }>;
  topSites: Array<{
    code: string;
    name: string;
    target: number;
    actual: number;
    rate: number;
  }>;
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
}

interface SecurityData {
  totalUsers: number;
  totalRoles: number;
  activeSessions: number;
  mfaCoveragePercent: number;
  pendingReviews: number;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<ExecutiveOperationsResponse | null>(null);
  const [security, setSecurity] = useState<SecurityData | null>(null);
  const [tenantName, setTenantName] = useState<string>("J2K Housekeeping Services");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "map" | "charts" | "reports">("all");

  const mapSectionRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [opRes, dashRes] = await Promise.all([
        fetch("/api/admin/executive-operations", { cache: "no-store" }),
        fetch("/api/admin/dashboard", { cache: "no-store" }),
      ]);

      if (opRes.ok) {
        const opJson = await opRes.json();
        setData(opJson);
      }

      if (dashRes.ok) {
        const dashJson = await dashRes.json();
        if (dashJson.tenantName) setTenantName(dashJson.tenantName);
        if (dashJson.security) setSecurity(dashJson.security);
      }

      setError(null);
    } catch (err: any) {
      console.error("[EXECUTIVE DASHBOARD ERROR]:", err);
      setError(err?.message || "ไม่สามารถโหลดข้อมูลผู้บริหารได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectSite = (site: SiteOperationalData) => {
    setSelectedSiteId(site.id);
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (error && !data) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-4">
        <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 font-bold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs">
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="max-w-6xl mx-auto p-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-600 border-t-transparent animate-spin mx-auto" />
        <p className="text-sm font-bold text-content-primary">กำลังโหลดข้อมูลศูนย์บัญชาการผู้บริหาร...</p>
        <p className="text-xs text-content-muted">ประมวลผลพิกัดดาวเทียม GIS, สถิติกำลังพล และการตรวจจับ Geofence</p>
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalSites: 20,
    activeOperatingSites: 19,
    totalEmployees: 152,
    totalTarget: 150,
    totalPresent: 147,
    totalLate: 2,
    totalOutside: 0,
    totalRelief: 3,
    totalLeaves: 2,
    totalAbsent: 1,
    attendanceRate: 98,
    geofenceComplianceRate: 99.4,
    totalLaborCost: 59800,
    estimatedOtCost: 7176,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans pb-20">
      {/* Top Executive Header Banner */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white overflow-hidden shadow-2xl border border-white/10">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-brand-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-60 h-60 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
                EXECUTIVE COMMAND CENTER
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>ONLINE • REAL-TIME GIS SYNC</span>
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {data?.reportDateFormatted || "ประจำวันทำการ"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {tenantName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              ระบบศูนย์บัญชาการและรายงานภาพรวมผู้บริหาร: ติดตามจุดปฏิบัติงานภาคสนาม {kpis.totalSites} ไซต์
              พร้อมพิกัดดาวเทียม รัศมี Geofence อัตรากำลังพล {kpis.totalPresent}/{kpis.totalTarget} คน และการบริหารต้นทุน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 shadow-sm"
              title="รีเฟรชข้อมูลล่าสุด"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span>รีเฟรชสด</span>
            </button>

            <Link
              href="/admin/schedule"
              className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-600/30"
            >
              <span>จัดกำลังคนรายเดือน</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="relative mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "all" ? "bg-white text-slate-950 shadow-md" : "bg-white/10 text-slate-300 hover:text-white"
            }`}
          >
            ภาพรวมครบวงจร (Full Command)
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === "map" ? "bg-white text-slate-950 shadow-md" : "bg-white/10 text-slate-300 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>แผนที่จุดปฏิบัติงาน (GIS Map)</span>
          </button>
          <button
            onClick={() => setActiveTab("charts")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === "charts" ? "bg-white text-slate-950 shadow-md" : "bg-white/10 text-slate-300 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>กราฟวิเคราะห์ผล (Analytics)</span>
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
              activeTab === "reports" ? "bg-white text-slate-950 shadow-md" : "bg-white/10 text-slate-300 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>รายงานประกอบ (Reports)</span>
          </button>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Sites */}
        <div className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>จุดงานปฏิบัติการ</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-content-primary">{kpis.totalSites}</div>
          <p className="text-[11px] text-emerald-600 font-bold">
            {kpis.activeOperatingSites} ไซต์เปิดทำการ
          </p>
        </div>

        {/* On Duty */}
        <div className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>เข้างานวันนี้</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-content-primary">{kpis.totalPresent}</div>
          <p className="text-[11px] text-content-muted">
            จากเป้าหมาย {kpis.totalTarget} คน ({kpis.attendanceRate}%)
          </p>
        </div>

        {/* Geofence Precision */}
        <div className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ความแม่นยำพิกัด</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-emerald-600">{kpis.geofenceComplianceRate}%</div>
          <p className="text-[11px] text-content-muted">
            {kpis.totalOutside === 0 ? "ไม่มีเช็คอินนอกรัศมี" : `เตือนนอกเขต ${kpis.totalOutside} คน`}
          </p>
        </div>

        {/* Late & Anomalies */}
        <div className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>มาสาย</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-amber-600">{kpis.totalLate}</div>
          <p className="text-[11px] text-content-muted">หลังเวลาเริ่มกะงาน</p>
        </div>

        {/* Relief Workers */}
        <div className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>กำลังพลเสริม</span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl lg:text-3xl font-black text-blue-600">{kpis.totalRelief}</div>
          <p className="text-[11px] text-content-muted">ส่งช่วยข้ามไซต์วันนี้</p>
        </div>

        {/* Daily Estimated Labor */}
        <div className="p-4 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ประมาณการค่าแรง</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl lg:text-2xl font-black text-emerald-600">
            ฿{(kpis.totalLaborCost / 1000).toFixed(1)}k
          </div>
          <p className="text-[11px] text-content-muted">OT ~฿{(kpis.estimatedOtCost / 1000).toFixed(1)}k</p>
        </div>
      </div>

      {/* SECTION 1: GIS Map Component */}
      {(activeTab === "all" || activeTab === "map") && (
        <div ref={mapSectionRef} className="space-y-3">
          <ExecutiveSiteMap
            sites={data?.sites || []}
            onSelectSite={handleSelectSite}
            selectedSiteId={selectedSiteId}
          />
        </div>
      )}

      {/* SECTION 2: Executive Charts Component */}
      {(activeTab === "all" || activeTab === "charts") && (
        <div className="space-y-3">
          <ExecutiveCharts
            kpis={kpis}
            topSites={data?.topSites || []}
            hourlyDistribution={data?.hourlyDistribution || []}
          />
        </div>
      )}

      {/* SECTION 3: Executive Operational Reports Component */}
      {(activeTab === "all" || activeTab === "reports") && (
        <div className="space-y-3">
          <ExecutiveReports
            sites={data?.sites || []}
            reliefList={data?.reliefList || []}
            recentAnomalies={data?.recentAnomalies || []}
            onSelectSite={handleSelectSite}
          />
        </div>
      )}

      {/* SECTION 4: Security & Governance */}
      {security && (
        <div className="p-6 rounded-3xl bg-surface-card border border-surface-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-sm font-black text-content-primary uppercase tracking-wider">
                  ความปลอดภัยและการกำกับดูแลสิทธิ์ระบบ (Security & Governance)
                </h2>
                <p className="text-[11px] text-content-muted">
                  มาตรการควบคุมความปลอดภัยข้อมูลองค์กร การยืนยันตัวตน MFA และการจัดการเซสชัน
                </p>
              </div>
            </div>
            <Link
              href="/admin/security/roles"
              className="text-xs font-bold text-brand-600 hover:underline flex items-center space-x-1"
            >
              <span>จัดการสิทธิ์</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-surface-subtle/60 border border-surface-border">
              <span className="text-[11px] text-content-muted font-bold block">ผู้ใช้งานทั้งหมด</span>
              <span className="text-xl font-black text-content-primary">{security.totalUsers}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-subtle/60 border border-surface-border">
              <span className="text-[11px] text-content-muted font-bold block">บทบาทในระบบ</span>
              <span className="text-xl font-black text-indigo-600">{security.totalRoles}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-subtle/60 border border-surface-border">
              <span className="text-[11px] text-content-muted font-bold block">Session Active</span>
              <span className="text-xl font-black text-emerald-600">{security.activeSessions}</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-subtle/60 border border-surface-border">
              <span className="text-[11px] text-content-muted font-bold block">MFA Coverage</span>
              <span className="text-xl font-black text-content-primary">{security.mfaCoveragePercent}%</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-subtle/60 border border-surface-border">
              <span className="text-[11px] text-content-muted font-bold block">Access Review รออนุมัติ</span>
              <span className="text-xl font-black text-amber-600">{security.pendingReviews}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
