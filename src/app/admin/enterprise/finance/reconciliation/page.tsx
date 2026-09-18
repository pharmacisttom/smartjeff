import { prisma } from "@/lib/prisma";
import { CheckCircle2, Calendar, Layers, DollarSign } from "lucide-react";
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

export default async function FinanceReconciliationPage() {
  const entries = await prisma.cashLedgerEntry.findMany({
    orderBy: { entryDate: "desc" },
    take: 100,
  });

  const reconciledCount = entries.filter((e) => e.isReconciled).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FINANCE / BANK RECONCILIATION"
        title="กระทบยอดเงินฝากธนาคาร (Bank Reconciliation)"
        description="ตรวจสอบความถูกต้องระหว่างยอดเงินในระบบ SmartJeff กับรายการเดินบัญชีจริงจากธนาคาร (Bank Statement)"
        breadcrumbs={[
          { label: "การเงิน", href: "/admin/enterprise/finance" },
          { label: "กระทบยอดบัญชี" },
        ]}
      />

      <EnterpriseModuleNav tabs={FINANCE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">รายการกระทบยอดบัญชี ({entries.length})</h2>
            <p className="text-xs text-emerald-600 font-bold mt-0.5">
              กระทบยอดสำเร็จแล้ว {reconciledCount} จาก {entries.length} รายการ
            </p>
          </div>
          <span className="text-xs text-content-muted">MySQL Bank Records</span>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <CheckCircle2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการกระทบยอด</p>
            <p className="text-xs">เมื่อมีการบันทึกรายรับหรือรายจ่าย สามารถกระทบยอดกับ Statement ธนาคารได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่บันทึก</th>
                  <th className="p-3">คำอธิบายรายการ</th>
                  <th className="p-3">บัญชีธนาคาร</th>
                  <th className="p-3">จำนวนเงิน</th>
                  <th className="p-3">เลขอ้างอิงธนาคาร</th>
                  <th className="p-3 rounded-r-xl">สถานะกระทบยอด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-semibold">{new Date(e.entryDate).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-bold text-content-primary">{e.description}</td>
                    <td className="p-3 text-content-secondary">{e.bankAccount || "บัญชีหลัก"}</td>
                    <td className={`p-3 font-bold ${e.direction === "IN" ? "text-emerald-600" : "text-rose-600"}`}>
                      {e.direction === "IN" ? "+" : "-"}฿{Number(e.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-content-muted">{e.bankRefNo || "-"}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        e.isReconciled ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {e.isReconciled ? "กระทบยอดแล้ว" : "รอกระทบยอด"}
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
