import { Database, Table, Layers } from "lucide-react";
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

const DATA_MODELS = [
  { name: "Employee", domain: "Workforce", description: "ข้อมูลประวัติพนักงาน เงินเดือน ตำแหน่ง ไซต์งาน และเอกสารประจำตัว" },
  { name: "Attendance", domain: "Operations", description: "บันทึกเวลาปฏิบัติงาน พิกัด GPS ระยะห่าง Geofence รูปถ่าย และสถานะอนุมัติ" },
  { name: "Project", domain: "Enterprise", description: "โครงการหลัก สัญญา งบประมาณ ต้นทุนจริง และงวดงาน" },
  { name: "Vehicle", domain: "Fleet", description: "ยานพาหนะ ทะเบียนรถ เลขไมล์ ประกัน และบันทึกซ่อมบำรุง" },
  { name: "PurchaseOrder", domain: "Procurement", description: "ใบสั่งซื้อ คู่ค้า รายการสินค้า และประวัติการตรวจรับ" },
  { name: "Invoice", domain: "Finance", description: "ใบแจ้งหนี้ วางบิล เรียกเก็บเงิน และยอดค้างชำระ" },
  { name: "Incident", domain: "QHSE", description: "รายงานอุบัติเหตุ ความเสียหาย และมาตรการแก้ไขป้องกัน (CAPA)" },
  { name: "UserSession", domain: "Security", description: "เซสชันผู้ใช้งาน IP Address อุปกรณ์ และสถานะการเพิกถอนสิทธิ์" },
];

export default function AnalyticsCatalogPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ANALYTICS / ENTERPRISE DATA CATALOG"
        title="พจนานุกรมข้อมูลและโครงสร้างข้อมูลองค์กร (Data Catalog)"
        description="พจนานุกรมข้อมูลและโครงสร้างตารางข้อมูลในระบบ SmartJeff เพื่อการทำ BI และ Data Analytics"
        breadcrumbs={[
          { label: "การวิเคราะห์ข้อมูล", href: "/admin/analytics" },
          { label: "พจนานุกรมข้อมูล (Catalog)" },
        ]}
      />

      <EnterpriseModuleNav tabs={ANALYTICS_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ตารางข้อมูลหลัก (Core Schema Entities)</h2>
          <span className="text-xs text-content-muted">MySQL 8 / Prisma ORM</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DATA_MODELS.map((m) => (
            <div key={m.name} className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">{m.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600">
                  {m.domain}
                </span>
              </div>
              <p className="text-xs text-content-secondary">{m.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
