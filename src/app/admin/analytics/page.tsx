import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BarChart3, TrendingUp, Users, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ANALYTICS_TABS = [
  { label: "ภาพรวมวิเคราะห์ข้อมูล", href: "/admin/analytics" },
  { label: "ดัชนีชี้วัดองค์กร (KPIs)", href: "/admin/analytics/kpis" },
  { label: "แดชบอร์ดสรุปผล", href: "/admin/analytics/dashboards" },
  { label: "คุณภาพข้อมูล (Data Quality)", href: "/admin/analytics/data-quality" },
  { label: "พจนานุกรมข้อมูล (Catalog)", href: "/admin/analytics/catalog" },
];

export default async function AnalyticsOverviewPage() {
  const [empCount, siteCount, attCount, projectCount] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }).catch(() => 0),
    prisma.site.count().catch(() => 0),
    prisma.attendance.count().catch(() => 0),
    prisma.project.count().catch(() => 0),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE BUSINESS ANALYTICS"
        title="การวิเคราะห์ข้อมูลและดัชนีชี้วัดขั้นสูง (Enterprise Analytics)"
        description="ศูนย์วิเคราะห์ข้อมูลกำลังคน ประสิทธิภาพการดำเนินงาน ต้นทุน และดัชนีชี้วัดความสำเร็จขององค์กร (Executive KPIs)"
        breadcrumbs={[{ label: "วิเคราะห์ข้อมูลขั้นสูง" }]}
      />

      <EnterpriseModuleNav tabs={ANALYTICS_TABS} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>กำลังคนในระบบ</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{empCount} คน</div>
          <p className="text-[11px] text-emerald-600 font-bold">พนักงานที่ปฏิบัติงานอยู่</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ไซต์งานและโรงงาน</span>
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{siteCount} แห่ง</div>
          <p className="text-[11px] text-content-muted">ครอบคลุมทุกนิคมฯ</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>บันทึกการลงเวลาสะสม</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{attCount.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">GPS & Facial Attendance</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>โครงการที่อยู่ระหว่างทำ</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{projectCount} โครงการ</div>
          <p className="text-[11px] text-emerald-600 font-bold">Active Projects</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/analytics/kpis"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ดัชนีชี้วัดองค์กร (Executive KPIs)</h3>
          <p className="text-xs text-content-muted mt-1">อัตราการมาทำงาน การลา ผลผลิตเฉลี่ย และต้นทุนแรงงานต่อชั่วโมง</p>
        </Link>

        <Link
          href="/admin/analytics/data-quality"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">การตรวจสอบคุณภาพข้อมูล (Data Quality Audit)</h3>
          <p className="text-xs text-content-muted mt-1">ความสมบูรณ์ของประวัติพนักงาน การลงเวลา และข้อมูลพิกัด GPS</p>
        </Link>
      </div>
    </div>
  );
}
