import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TrendingUp, Users, Target, FileSpreadsheet, FileCheck, ArrowRight, DollarSign } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const CRM_TABS = [
  { label: "ภาพรวม CRM", href: "/admin/enterprise/crm" },
  { label: "รายชื่อลูกค้า & ลีด", href: "/admin/enterprise/crm/leads" },
  { label: "โอกาสการขาย", href: "/admin/enterprise/crm/opportunities" },
  { label: "การประกวดราคา", href: "/admin/enterprise/crm/tenders" },
  { label: "ประมาณการต้นทุน", href: "/admin/enterprise/crm/estimates" },
  { label: "ใบเสนอราคา", href: "/admin/enterprise/crm/quotations" },
  { label: "ไปป์ไลน์การขาย", href: "/admin/enterprise/crm/pipeline" },
];

export default async function CRMOverviewPage() {
  const [clientsCount, opportunities, tendersCount, estimatesCount, quotationsCount] = await Promise.all([
    prisma.client.count({ where: { isActive: true } }),
    prisma.opportunity.findMany({
      include: { client: { select: { id: true, name: true, code: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.tender.count(),
    prisma.costEstimate.count(),
    prisma.quotation.count(),
  ]);

  const totalValue = opportunities.reduce((acc, curr) => acc + Number(curr.estimatedValue || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE CRM"
        title="บริหารความสัมพันธ์ลูกค้าและโอกาสทางการค้า (CRM)"
        description="ศูนย์รวมข้อมูลลูกค้า โอกาสทางการค้า ติดตามการเสนอราคา และวิเคราะห์ไปป์ไลน์งานขายขององค์กร"
        breadcrumbs={[{ label: "ลูกค้าและงานขาย (CRM)" }]}
      />

      <EnterpriseModuleNav tabs={CRM_TABS} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ฐานลูกค้า (Clients)</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{clientsCount} ราย</div>
          <p className="text-[11px] text-emerald-600 font-bold">ข้อมูลจาก MySQL</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>โอกาสทางการค้า</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{opportunities.length} โอกาส</div>
          <p className="text-[11px] text-content-muted">บันทึกในระบบ</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>มูลค่าไปป์ไลน์รวม</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">฿{totalValue.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">คำนวณจาก Opportunity ล่าสุด</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>เอกสารเสนอราคา</span>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{quotationsCount} ฉบับ</div>
          <p className="text-[11px] text-content-muted">Tender: {tendersCount} · Estimate: {estimatesCount}</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/enterprise/crm/leads"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Users className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">รายชื่อลูกค้า & ลีด (Leads)</h3>
          <p className="text-xs text-content-muted mt-1">จัดการรายชื่อผู้ว่าจ้าง บริษัทคู่ค้า และช่องทางติดต่อ</p>
        </Link>

        <Link
          href="/admin/enterprise/crm/opportunities"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Target className="w-6 h-6 text-indigo-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">โอกาสทางการค้า (Opportunities)</h3>
          <p className="text-xs text-content-muted mt-1">บันทึกดีลงาน โอกาสรับงาน และสถานะความคืบหน้า</p>
        </Link>

        <Link
          href="/admin/enterprise/crm/pipeline"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ไปป์ไลน์การขาย (Sales Pipeline)</h3>
          <p className="text-xs text-content-muted mt-1">ดูภาพรวมการไหลของงานขายตาม Stage และความน่าจะเป็น</p>
        </Link>
      </div>

      {/* Recent Deals Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">โอกาสทางการค้าล่าสุด (Recent Opportunities)</h2>
          <Link href="/admin/enterprise/crm/opportunities" className="text-xs font-bold text-brand-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>

        {opportunities.length === 0 ? (
          <div className="p-8 text-center text-content-muted text-xs">ยังไม่มีรายการโอกาสการขายในระบบ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">หัวข้อดีล</th>
                  <th className="p-3">ลูกค้า / บริษัท</th>
                  <th className="p-3">มูลค่าโดยประมาณ</th>
                  <th className="p-3">สถานะ (Stage)</th>
                  <th className="p-3 rounded-r-xl">ความน่าจะเป็น</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-bold text-content-primary">{opp.title}</td>
                    <td className="p-3 text-content-secondary">{opp.client?.name || "ไม่ระบุ"}</td>
                    <td className="p-3 font-semibold text-emerald-600">
                      ฿{Number(opp.estimatedValue || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {opp.stage}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-content-muted">{opp.probability || 50}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
