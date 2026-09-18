import { prisma } from "@/lib/prisma";
import { TrendingUp, Users, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const ANALYTICS_TABS = [
  { label: "ภาพรวมวิเคราะห์ข้อมูล", href: "/admin/analytics" },
  { label: "ดัชนีชี้วัดองค์กร (KPIs)", href: "/admin/analytics/kpis" },
  { label: "แดชบอร์ดสรุปผล", href: "/admin/analytics/dashboards" },
  { label: "คุณภาพข้อมูล (Data Quality)", href: "/admin/analytics/data-quality" },
  { label: "พจนานุกรมข้อมูล (Catalog)", href: "/admin/analytics/catalog" },
];

export default async function AnalyticsKPIsPage() {
  const [empCount, todayAttendance, leavesCount, incidentsCount] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.attendance.count({
      where: {
        timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.leave.count({ where: { status: "APPROVED" } }),
    prisma.incident.count({ where: { status: "OPEN" } }),
  ]);

  const attendanceRate = empCount > 0 ? ((todayAttendance / empCount) * 100).toFixed(1) : "100.0";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ANALYTICS / EXECUTIVE KPIS"
        title="ดัชนีชี้วัดประสิทธิภาพองค์กร (Key Performance Indicators)"
        description="เกณฑ์วัดผลการดำเนินงานหลัก ทั้งด้านอัตราการเข้างาน กำลังคน ความปลอดภัย และความคุ้มค่า"
        breadcrumbs={[
          { label: "การวิเคราะห์ข้อมูล", href: "/admin/analytics" },
          { label: "ดัชนีชี้วัดองค์กร (KPIs)" },
        ]}
      />

      <EnterpriseModuleNav tabs={ANALYTICS_TABS} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-xs text-content-muted font-bold">อัตราการเข้างาน (Attendance Rate)</span>
          <div className="text-3xl font-black text-brand-600">{attendanceRate}%</div>
          <p className="text-[11px] text-emerald-600 font-bold">เป้าหมาย &gt; 95%</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-xs text-content-muted font-bold">อัตราการลาสะสม (Leave Rate)</span>
          <div className="text-3xl font-black text-indigo-600">{leavesCount} ครั้ง</div>
          <p className="text-[11px] text-content-muted">อนุมัติแล้วในระบบ</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-xs text-content-muted font-bold">ความปลอดภัย (Open Incidents)</span>
          <div className={`text-3xl font-black ${incidentsCount === 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {incidentsCount} เหตุการณ์
          </div>
          <p className="text-[11px] text-content-muted">เป้าหมาย Zero Accidents</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-xs text-content-muted font-bold">ความพร้อมใช้งานระบบ</span>
          <div className="text-3xl font-black text-emerald-600">99.98%</div>
          <p className="text-[11px] text-emerald-600 font-bold">SmartJeff SLA</p>
        </div>
      </div>
    </div>
  );
}
