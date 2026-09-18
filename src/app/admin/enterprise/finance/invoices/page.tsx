import { prisma } from "@/lib/prisma";
import { FileText, Calendar, DollarSign, Users } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const FINANCE_TABS = [
  { label: "ภาพรวมการเงิน", href: "/admin/enterprise/finance" },
  { label: "ใบแจ้งหนี้ (Invoices)", href: "/admin/enterprise/finance/invoices" },
  { label: "ลูกหนี้การค้า (AR)", href: "/admin/enterprise/finance/ar" },
  { label: "เจ้าหนี้การค้า (AP)", href: "/admin/enterprise/finance/ap" },
  { label: "ใบเสร็จรับเงิน", href: "/admin/enterprise/finance/receipts" },
  { label: "จ่ายชำระเงิน", href: "/admin/enterprise/finance/payments" },
  { label: "กระทบยอดบัญชี", href: "/admin/enterprise/finance/reconciliation" },
  { label: "กระแสเงินสด", href: "/admin/enterprise/finance/cash-flow" },
];

export default async function FinanceInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    include: {
      client: { select: { name: true, code: true } },
      project: { select: { name: true } },
    },
    orderBy: { issueDate: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FINANCE / CUSTOMER INVOICES"
        title="ใบแจ้งหนี้และการวางบิล (Customer Invoices)"
        description="รายการใบแจ้งหนี้เรียกเก็บเงินลูกค้า ยอดภาษี วันครบกำหนดชำระ และสถานะการรับเงิน"
        breadcrumbs={[
          { label: "การเงิน", href: "/admin/enterprise/finance" },
          { label: "ใบแจ้งหนี้" },
        ]}
      />

      <EnterpriseModuleNav tabs={FINANCE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการใบแจ้งหนี้ทั้งหมด ({invoices.length} ฉบับ)</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการใบแจ้งหนี้</p>
            <p className="text-xs">สามารถออกใบแจ้งหนี้ตามงวดงานในสัญญาโครงการได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ใบแจ้งหนี้</th>
                  <th className="p-3">ลูกค้า</th>
                  <th className="p-3">โครงการ</th>
                  <th className="p-3">ยอดรวมก่อนภาษี</th>
                  <th className="p-3">ยอดสุทธิ</th>
                  <th className="p-3">วันครบกำหนด</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{inv.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">{inv.client?.name}</td>
                    <td className="p-3 text-content-secondary">{inv.project?.name || "-"}</td>
                    <td className="p-3 text-content-secondary">฿{Number(inv.subtotal || 0).toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-600">฿{Number(inv.totalAmount || 0).toLocaleString()}</td>
                    <td className="p-3 text-content-muted">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("th-TH") : "-"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
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
