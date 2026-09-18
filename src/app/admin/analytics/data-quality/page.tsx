import { prisma } from "@/lib/prisma";
import { ShieldCheck, AlertTriangle, CheckCircle2, Database } from "lucide-react";
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

export default async function AnalyticsDataQualityPage() {
  const [totalEmployees, missingIdCard, missingPhone, missingBank, attendancesWithoutCoords] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.employee.count({ where: { isActive: true, OR: [{ idCardNo: null }, { idCardNo: "" }] } }),
    prisma.employee.count({ where: { isActive: true, OR: [{ phone: null }, { phone: "" }] } }),
    prisma.employee.count({ where: { isActive: true, OR: [{ bankAccount: null }, { bankAccount: "" }] } }),
    prisma.attendance.count({ where: { lat: 0, lng: 0 } }),
  ]);

  const completeness = totalEmployees > 0
    ? (((totalEmployees * 3 - (missingIdCard + missingPhone + missingBank)) / (totalEmployees * 3)) * 100).toFixed(1)
    : "100.0";

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ANALYTICS / DATA QUALITY AUDIT"
        title="การตรวจประเมินคุณภาพข้อมูล (Data Quality Audit)"
        description="ตรวจสอบความสมบูรณ์ ถูกต้อง และความพร้อมใช้งานของข้อมูลในฐานข้อมูลหลัก (Master Data Integrity)"
        breadcrumbs={[
          { label: "การวิเคราะห์ข้อมูล", href: "/admin/analytics" },
          { label: "คุณภาพข้อมูล (Data Quality)" },
        ]}
      />

      <EnterpriseModuleNav tabs={ANALYTICS_TABS} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-xs text-content-muted font-bold">ความสมบูรณ์ของประวัติพนักงาน</span>
          <div className="text-3xl font-black text-brand-600">{completeness}%</div>
          <p className="text-[11px] text-emerald-600 font-bold">เกณฑ์มาตรฐาน &gt; 90%</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-xs text-content-muted font-bold">พนักงานที่ขาดข้อมูลสำคัญ</span>
          <div className="text-3xl font-black text-amber-600">
            {missingIdCard + missingPhone + missingBank} รายการ
          </div>
          <p className="text-[11px] text-content-muted">บัตร ปชช., เบอร์โทร, บัญชีธนาคาร</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <span className="text-xs text-content-muted font-bold">พิกัด GPS ผิดปกติ</span>
          <div className="text-3xl font-black text-emerald-600">{attendancesWithoutCoords} รายการ</div>
          <p className="text-[11px] text-emerald-600 font-bold">การลงเวลาบันทึกพิกัดถูกต้อง</p>
        </div>
      </div>
    </div>
  );
}
