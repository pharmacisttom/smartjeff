import { prisma } from "@/lib/prisma";
import { DollarSign, TrendingUp, FileText, CheckCircle2 } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const PROJECT_TABS = [
  { label: "โครงการทั้งหมด", href: "/admin/enterprise/projects" },
  { label: "สัญญาโครงการ", href: "/admin/enterprise/contracts" },
  { label: "งบประมาณ", href: "/admin/enterprise/budget" },
  { label: "ต้นทุนโครงการ", href: "/admin/enterprise/costs" },
  { label: "รายได้โครงการ", href: "/admin/enterprise/revenue" },
  { label: "วิเคราะห์ความสามารถทำกำไร", href: "/admin/enterprise/profitability" },
];

export default async function EnterpriseRevenuePage() {
  const invoices = await prisma.invoice.findMany({
    include: {
      client: { select: { name: true } },
      project: { select: { name: true, code: true } },
    },
    orderBy: { issueDate: "desc" },
    take: 100,
  });

  const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.paidAmount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="PROJECT REVENUE & BILLING"
        title="รายได้และการออกใบแจ้งหนี้โครงการ (Revenue & Billing)"
        description="ติดตามยอดเรียกเก็บเงินตามงวดงาน การชำระเงินของลูกค้า และยอดค้างชำระ"
        breadcrumbs={[
          { label: "โครงการ", href: "/admin/enterprise/projects" },
          { label: "รายได้โครงการ" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROJECT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">รายการใบแจ้งหนี้โครงการ ({invoices.length})</h2>
            <div className="flex items-center space-x-4 text-xs font-bold mt-1">
              <span className="text-indigo-600">ยอดเรียกเก็บรวม: ฿{totalInvoiced.toLocaleString()}</span>
              <span className="text-emerald-600">รับชำระแล้ว: ฿{totalPaid.toLocaleString()}</span>
              <span className="text-amber-600">ค้างชำระ: ฿{(totalInvoiced - totalPaid).toLocaleString()}</span>
            </div>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <TrendingUp className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการใบแจ้งหนี้โครงการ</p>
            <p className="text-xs">สามารถออกใบแจ้งหนี้เพื่อเรียกเก็บเงินตามงวดงานในโมดูลการเงินได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ใบแจ้งหนี้</th>
                  <th className="p-3">ลูกค้า / โครงการ</th>
                  <th className="p-3">วันที่ออก</th>
                  <th className="p-3">ยอดรวม</th>
                  <th className="p-3">ชำระแล้ว</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">{inv.refNo}</td>
                    <td className="p-3 text-content-secondary">
                      <span className="font-bold text-content-primary block">{inv.client?.name || "ไม่ระบุ"}</span>
                      {inv.project && <span className="text-[10px] text-content-muted">{inv.project.name}</span>}
                    </td>
                    <td className="p-3 text-content-muted">{new Date(inv.issueDate).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-bold text-content-primary">
                      ฿{Number(inv.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(inv.paidAmount || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : inv.status === "SENT"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {inv.status}
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
