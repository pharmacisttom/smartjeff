import { prisma } from "@/lib/prisma";
import { CreditCard, Calendar, DollarSign, CheckCircle2 } from "lucide-react";
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

export default async function FinancePaymentsPage() {
  const payments = await prisma.payment.findMany({
    include: {
      supplierInvoice: {
        select: {
          refNo: true,
          supplier: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FINANCE / DISBURSEMENTS"
        title="จ่ายชำระเงินเจ้าหนี้และคู่ค้า (Supplier Payments)"
        description="ประวัติการจ่ายชำระค่าสินค้า ค่าบริการ ค่างวดสัญญา และค่าใช้จ่ายดำเนินงาน"
        breadcrumbs={[
          { label: "การเงิน", href: "/admin/enterprise/finance" },
          { label: "จ่ายชำระเงิน" },
        ]}
      />

      <EnterpriseModuleNav tabs={FINANCE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">รายการจ่ายชำระทั้งหมด ({payments.length} รายการ)</h2>
            <p className="text-xs text-indigo-600 font-bold mt-0.5">ยอดจ่ายชำระสะสม: ฿{totalPaid.toLocaleString()}</p>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {payments.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <CreditCard className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการจ่ายชำระเงิน</p>
            <p className="text-xs">สามารถอนุมัติจ่ายชำระใบแจ้งหนี้ของคู่ค้าได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่การจ่าย</th>
                  <th className="p-3">อ้างอิงบิลคู่ค้า</th>
                  <th className="p-3">ผู้รับเงิน / คู่ค้า</th>
                  <th className="p-3">ช่องทาง</th>
                  <th className="p-3">วันที่จ่าย</th>
                  <th className="p-3">จำนวนเงิน</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{p.refNo}</td>
                    <td className="p-3 font-mono text-content-secondary">{p.supplierInvoice?.refNo || "-"}</td>
                    <td className="p-3 font-bold text-content-primary">
                      {p.supplierInvoice?.supplier?.name || "เจ้าหนี้ทั่วไป"}
                    </td>
                    <td className="p-3 text-content-secondary">{p.method}</td>
                    <td className="p-3 text-content-muted">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString("th-TH") : "รอดำเนินการ"}
                    </td>
                    <td className="p-3 font-bold text-rose-600">
                      ฿{Number(p.amount || 0).toLocaleString()} {p.currency}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === "COMPLETED" || p.status === "PAID"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {p.status}
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
