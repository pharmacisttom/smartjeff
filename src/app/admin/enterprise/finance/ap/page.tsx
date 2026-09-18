import { prisma } from "@/lib/prisma";
import { TrendingDown, Calendar, DollarSign, Users } from "lucide-react";
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

export default async function FinanceAPPage() {
  const supplierInvoices = await prisma.supplierInvoice.findMany({
    include: {
      supplier: { select: { name: true, code: true } },
    },
    orderBy: { invoiceDate: "desc" },
    take: 100,
  });

  const totalPayable = supplierInvoices.reduce(
    (acc, si) => acc + (Number(si.totalAmount || 0) - Number(si.paidAmount || 0)),
    0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FINANCE / ACCOUNTS PAYABLE"
        title="เจ้าหนี้การค้าและการตั้งหนี้ (Accounts Payable)"
        description="ตรวจสอบใบแจ้งหนี้จากคู่ค้าและซัพพลายเออร์ การกระทบยอด 3 ทาง (3-Way Matching: PO vs GR vs Invoice) และกำหนดจ่ายเงิน"
        breadcrumbs={[
          { label: "การเงิน", href: "/admin/enterprise/finance" },
          { label: "เจ้าหนี้การค้า (AP)" },
        ]}
      />

      <EnterpriseModuleNav tabs={FINANCE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">ใบแจ้งหนี้คู่ค้า ({supplierInvoices.length} รายการ)</h2>
            <p className="text-xs text-rose-600 font-bold mt-0.5">ยอดเจ้าหนี้คงค้างรวม: ฿{totalPayable.toLocaleString()}</p>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {supplierInvoices.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <TrendingDown className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีใบแจ้งหนี้จากคู่ค้า</p>
            <p className="text-xs">เมื่อได้รับใบแจ้งหนี้จากคู่ค้า สามารถบันทึกเพื่อรอจ่ายชำระเงินได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่บิลคู่ค้า</th>
                  <th className="p-3">ผู้จำหน่าย / ซัพพลายเออร์</th>
                  <th className="p-3">ยอดรวม</th>
                  <th className="p-3">ชำระแล้ว</th>
                  <th className="p-3">คงค้างจ่าย</th>
                  <th className="p-3">PO / GR Match</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {supplierInvoices.map((si) => {
                  const unpaid = Number(si.totalAmount || 0) - Number(si.paidAmount || 0);

                  return (
                    <tr key={si.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand-600">{si.refNo}</td>
                      <td className="p-3 font-bold text-content-primary">{si.supplier?.name}</td>
                      <td className="p-3 font-semibold text-content-primary">
                        ฿{Number(si.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-emerald-600">
                        ฿{Number(si.paidAmount || 0).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-rose-600">฿{unpaid.toLocaleString()}</td>
                      <td className="p-3">
                        <span className="text-[10px] text-content-muted">
                          PO: {si.poMatched ? "✓" : "✗"} · GR: {si.grMatched ? "✓" : "✗"}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          si.status === "PAID" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                        }`}>
                          {si.status}
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
