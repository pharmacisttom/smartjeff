import { prisma } from "@/lib/prisma";
import { Target, DollarSign, Calendar, Users } from "lucide-react";
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

export default async function CRMOpportunitiesPage() {
  const opportunities = await prisma.opportunity.findMany({
    include: {
      client: { select: { id: true, name: true, code: true } },
      _count: { select: { tenders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="CRM / OPPORTUNITIES"
        title="โอกาสทางการค้า (Sales Opportunities)"
        description="ติดตามดีลงานขาย สถานะการเจรจา และคาดการณ์มูลค่าโครงการ"
        breadcrumbs={[
          { label: "CRM", href: "/admin/enterprise/crm" },
          { label: "โอกาสการขาย" },
        ]}
      />

      <EnterpriseModuleNav tabs={CRM_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการโอกาสทางการค้าทั้งหมด ({opportunities.length})</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {opportunities.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Target className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อมูลโอกาสการขาย</p>
            <p className="text-xs">สามารถสร้างดีลใหม่เพื่อเริ่มติดตามขั้นตอนการขาย</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">หัวข้อโครงการ / ดีล</th>
                  <th className="p-3">ลูกค้า</th>
                  <th className="p-3">มูลค่าโดยประมาณ</th>
                  <th className="p-3">ขั้นตอน (Stage)</th>
                  <th className="p-3">ความน่าจะเป็น</th>
                  <th className="p-3">กำหนดปิดดีล</th>
                  <th className="p-3 rounded-r-xl">Tenders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-bold text-content-primary">
                      {opp.title}
                      {opp.description && <span className="block text-[10px] text-content-muted truncate max-w-xs">{opp.description}</span>}
                    </td>
                    <td className="p-3 text-content-secondary font-medium">{opp.client?.name || "ไม่ระบุ"}</td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(opp.estimatedValue || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400">
                        {opp.stage}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-content-secondary">{opp.probability || 50}%</td>
                    <td className="p-3 text-content-muted">
                      {opp.expectedClose ? new Date(opp.expectedClose).toLocaleDateString("th-TH") : "-"}
                    </td>
                    <td className="p-3 font-bold text-indigo-600">{opp._count.tenders} รายการ</td>
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
