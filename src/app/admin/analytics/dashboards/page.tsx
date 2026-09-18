import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LayoutDashboard, Users, Clock, ShieldCheck, ArrowRight } from "lucide-react";
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

export default async function AnalyticsDashboardsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ANALYTICS / DASHBOARDS"
        title="แดชบอร์ดสรุปผลเชิงบริหาร (Executive Dashboards)"
        description="กระดานสรุปผลงานระดับผู้บริหาร เชื่อมโยงข้อมูลทรัพยากรบุคคล การปฏิบัติงาน และการเงิน"
        breadcrumbs={[
          { label: "การวิเคราะห์ข้อมูล", href: "/admin/analytics" },
          { label: "แดชบอร์ดสรุปผล" },
        ]}
      />

      <EnterpriseModuleNav tabs={ANALYTICS_TABS} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/dashboard"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-6 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <LayoutDashboard className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">แดชบอร์ดผู้บริหารหลัก (Core Dashboard)</h3>
          <p className="text-xs text-content-muted mt-1">ภาพรวมกำลังคน เข้างาน ลางาน และการแจ้งเตือนสด</p>
        </Link>

        <Link
          href="/admin/reports/daily"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-6 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-6 h-6 text-indigo-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">รายงานสรุปประจำวัน (Daily Operations Report)</h3>
          <p className="text-xs text-content-muted mt-1">สรุปการมาทำงานรายวัน สถิติมาสาย และการทำงานล่วงเวลา</p>
        </Link>

        <Link
          href="/admin/roi"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-6 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">การวิเคราะห์ความคุ้มค่าการลงทุน (ROI Analytics)</h3>
          <p className="text-xs text-content-muted mt-1">ประเมินผลตอบแทนจากการใช้ระบบ SmartJeff ลดการรั่วไหลของต้นทุน</p>
        </Link>
      </div>
    </div>
  );
}
