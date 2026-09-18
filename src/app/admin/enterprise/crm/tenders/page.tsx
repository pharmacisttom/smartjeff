import { prisma } from "@/lib/prisma";
import { FileSpreadsheet, Calendar, DollarSign, Clock } from "lucide-react";
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

export default async function CRMTendersPage() {
  const tenders = await prisma.tender.findMany({
    include: {
      opportunity: { select: { id: true, title: true, client: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="CRM / TENDERS"
        title="การประกวดราคาและยื่นซองประมูล (Tenders)"
        description="ติดตามเอกสาร TOR กำหนดยื่นซอง และงบประมาณโครงการประมูล"
        breadcrumbs={[
          { label: "CRM", href: "/admin/enterprise/crm" },
          { label: "การประกวดราคา" },
        ]}
      />

      <EnterpriseModuleNav tabs={CRM_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการประกวดราคาทั้งหมด ({tenders.length})</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {tenders.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อมูลการประกวดราคา</p>
            <p className="text-xs">สามารถบันทึกข้อมูลการยื่นซองประมูลและเงื่อนไข TOR ได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่อ้างอิง</th>
                  <th className="p-3">ชื่องานประมูล</th>
                  <th className="p-3">ลูกค้า / โอกาสการขาย</th>
                  <th className="p-3">งบประมาณ</th>
                  <th className="p-3">กำหนดยื่นซอง</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {tenders.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {t.refNo || t.id.slice(0, 8)}
                    </td>
                    <td className="p-3 font-bold text-content-primary">{t.title}</td>
                    <td className="p-3 text-content-secondary">
                      {t.opportunity?.client?.name || t.opportunity?.title || "-"}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(t.budget || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-content-muted">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString("th-TH") : "-"}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {t.status}
                      </span>
                    </td>
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
