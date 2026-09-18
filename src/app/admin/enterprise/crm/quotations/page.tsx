import { prisma } from "@/lib/prisma";
import { FileText, Calendar, DollarSign } from "lucide-react";
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

export default async function CRMQuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    include: {
      opportunity: { select: { id: true, title: true, client: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="CRM / QUOTATIONS"
        title="ใบเสนอราคา (Quotations)"
        description="ออกและติดตามสถานะใบเสนอราคาที่ส่งให้ลูกค้า พร้อมกำหนดอายุเอกสาร"
        breadcrumbs={[
          { label: "CRM", href: "/admin/enterprise/crm" },
          { label: "ใบเสนอราคา" },
        ]}
      />

      <EnterpriseModuleNav tabs={CRM_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการใบเสนอราคาทั้งหมด ({quotations.length})</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {quotations.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีใบเสนอราคาในระบบ</p>
            <p className="text-xs">สามารถสร้างใบเสนอราคาใหม่เพื่อส่งให้ลูกค้าพิจารณาได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ใบเสนอราคา</th>
                  <th className="p-3">ชื่อรายการ / หัวข้อ</th>
                  <th className="p-3">ลูกค้า</th>
                  <th className="p-3">มูลค่ารวม</th>
                  <th className="p-3">มีผลถึง</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {q.refNo || q.id.slice(0, 8)}
                    </td>
                    <td className="p-3 font-bold text-content-primary">{q.title}</td>
                    <td className="p-3 text-content-secondary">
                      {q.opportunity?.client?.name || q.opportunity?.title || "-"}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(q.totalAmount || 0).toLocaleString()} {q.currency}
                    </td>
                    <td className="p-3 text-content-muted">
                      {q.validUntil ? new Date(q.validUntil).toLocaleDateString("th-TH") : "-"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === "ACCEPTED"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : q.status === "SENT"
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {q.status}
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
