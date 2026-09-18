import { prisma } from "@/lib/prisma";
import { Calculator, CheckCircle2, DollarSign } from "lucide-react";
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

export default async function CRMEstimatesPage() {
  const estimates = await prisma.costEstimate.findMany({
    include: {
      opportunity: { select: { id: true, title: true, client: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="CRM / COST ESTIMATION"
        title="ประมาณการต้นทุนโครงการ (Cost Estimates)"
        description="คำนวณต้นทุนแรงงาน วัสดุ ยานพาหนะ และส่วนต่างกำไร (Margin) ก่อนออกใบเสนอราคา"
        breadcrumbs={[
          { label: "CRM", href: "/admin/enterprise/crm" },
          { label: "ประมาณการต้นทุน" },
        ]}
      />

      <EnterpriseModuleNav tabs={CRM_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการประมาณการต้นทุนทั้งหมด ({estimates.length})</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {estimates.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Calculator className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการประมาณการต้นทุน</p>
            <p className="text-xs">สามารถสร้างใบประมาณการต้นทุนเพื่อวางแผนราคางานได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">ชื่อประมาณการ</th>
                  <th className="p-3">โครงการ / โอกาส</th>
                  <th className="p-3">ต้นทุนแรงงาน</th>
                  <th className="p-3">ต้นทุนรวม</th>
                  <th className="p-3">ราคาเสนอขาย</th>
                  <th className="p-3 rounded-r-xl">สถานะอนุมัติ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {estimates.map((est) => (
                  <tr key={est.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-bold text-content-primary">
                      {est.name} <span className="text-[10px] text-content-muted">(v{est.version})</span>
                    </td>
                    <td className="p-3 text-content-secondary">
                      {est.opportunity?.title || est.opportunity?.client?.name || "-"}
                    </td>
                    <td className="p-3 font-medium text-content-secondary">
                      ฿{Number(est.laborCost || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-rose-600">
                      ฿{Number(est.totalCost || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(est.sellPrice || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        est.isApproved
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {est.isApproved ? "อนุมัติแล้ว" : "รออนุมัติ"}
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
