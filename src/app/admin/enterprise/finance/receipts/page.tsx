import { prisma } from "@/lib/prisma";
import { DollarSign, Calendar, FileText, CheckCircle2 } from "lucide-react";
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

export default async function FinanceReceiptsPage() {
  const receipts = await prisma.receipt.findMany({
    include: {
      invoice: { select: { refNo: true, client: { select: { name: true } } } },
    },
    orderBy: { receivedAt: "desc" },
    take: 100,
  });

  const totalReceived = receipts.reduce((acc, r) => acc + Number(r.amount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FINANCE / PAYMENT RECEIPTS"
        title="ใบเสร็จรับเงินและการชำระเงินของลูกค้า (Receipts)"
        description="ประวัติการรับชำระเงิน ช่องทางการชำระ (โอน/เช็ค) และเลขที่อ้างอิงธนาคาร"
        breadcrumbs={[
          { label: "การเงิน", href: "/admin/enterprise/finance" },
          { label: "ใบเสร็จรับเงิน" },
        ]}
      />

      <EnterpriseModuleNav tabs={FINANCE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">ใบเสร็จรับเงินทั้งหมด ({receipts.length} ฉบับ)</h2>
            <p className="text-xs text-emerald-600 font-bold mt-0.5">ยอดรับเงินสะสม: ฿{totalReceived.toLocaleString()}</p>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {receipts.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <DollarSign className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการใบเสร็จรับเงิน</p>
            <p className="text-xs">เมื่อลูกค้าชำระเงิน สามารถออกใบเสร็จรับเงินเพื่อตัดยอดหนี้ได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ใบเสร็จ</th>
                  <th className="p-3">อ้างอิงใบแจ้งหนี้</th>
                  <th className="p-3">ลูกค้า</th>
                  <th className="p-3">ช่องทางชำระ</th>
                  <th className="p-3">วันที่รับเงิน</th>
                  <th className="p-3">เลขอ้างอิงธนาคาร</th>
                  <th className="p-3 rounded-r-xl">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{r.refNo}</td>
                    <td className="p-3 font-mono text-indigo-600 font-semibold">{r.invoice.refNo}</td>
                    <td className="p-3 font-bold text-content-primary">{r.invoice.client?.name}</td>
                    <td className="p-3 text-content-secondary">{r.method}</td>
                    <td className="p-3 text-content-muted">{new Date(r.receivedAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-mono text-content-secondary">{r.bankRefNo || "-"}</td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(r.amount || 0).toLocaleString()}
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
