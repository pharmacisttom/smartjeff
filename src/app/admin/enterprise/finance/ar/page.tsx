import { prisma } from "@/lib/prisma";
import { TrendingUp, Calendar, AlertCircle, DollarSign } from "lucide-react";
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

export default async function FinanceARPage() {
  const unpaidInvoices = await prisma.invoice.findMany({
    where: { status: { not: "PAID" } },
    include: {
      client: { select: { name: true, contactPhone: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const totalOutstanding = unpaidInvoices.reduce(
    (acc, inv) => acc + (Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0)),
    0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FINANCE / ACCOUNTS RECEIVABLE"
        title="ลูกหนี้การค้าและการติดตามหนี้ (Accounts Receivable)"
        description="รายการใบแจ้งหนี้ที่ยังไม่ได้รับชำระ ยอดค้างชำระ และการติดตามครบกำหนดชำระเงินของลูกค้า"
        breadcrumbs={[
          { label: "การเงิน", href: "/admin/enterprise/finance" },
          { label: "ลูกหนี้การค้า (AR)" },
        ]}
      />

      <EnterpriseModuleNav tabs={FINANCE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">ลูกหนี้ค้างชำระ ({unpaidInvoices.length} รายการ)</h2>
            <p className="text-xs text-brand-600 font-bold mt-0.5">ยอดลูกหนี้ค้างชำระรวม: ฿{totalOutstanding.toLocaleString()}</p>
          </div>
          <span className="text-xs text-content-muted">MySQL AR Ledger</span>
        </div>

        {unpaidInvoices.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <TrendingUp className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ไม่มียอดลูกหนี้ค้างชำระ</p>
            <p className="text-xs">ลูกค้าชำระเงินครบถ้วนทุกรายการเรียบร้อยแล้ว</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ใบแจ้งหนี้</th>
                  <th className="p-3">ลูกค้า</th>
                  <th className="p-3">ยอดรวม</th>
                  <th className="p-3">ชำระแล้ว</th>
                  <th className="p-3">ยอดค้างชำระ</th>
                  <th className="p-3">วันครบกำหนด</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {unpaidInvoices.map((inv) => {
                  const outstanding = Number(inv.totalAmount || 0) - Number(inv.paidAmount || 0);
                  const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();

                  return (
                    <tr key={inv.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-600">{inv.refNo}</td>
                      <td className="p-3 font-bold text-content-primary">
                        {inv.client?.name}
                        {inv.client?.contactPhone && (
                          <span className="block text-[10px] text-content-muted">{inv.client.contactPhone}</span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-content-primary">
                        ฿{Number(inv.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-emerald-600">
                        ฿{Number(inv.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-rose-600">฿{outstanding.toLocaleString()}</td>
                      <td className={`p-3 font-medium ${isOverdue ? "text-rose-600 font-bold" : "text-content-muted"}`}>
                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("th-TH") : "-"}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOverdue ? "bg-rose-500/10 text-rose-600" : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {isOverdue ? "เกินกำหนดชำระ" : inv.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
