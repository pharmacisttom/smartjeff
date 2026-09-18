import { prisma } from "@/lib/prisma";
import { Layers, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
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

export default async function FinanceCashFlowPage() {
  const ledger = await prisma.cashLedgerEntry.findMany({
    orderBy: { entryDate: "desc" },
    take: 100,
  });

  const totalIn = ledger.filter((l) => l.direction === "IN").reduce((acc, l) => acc + Number(l.amount || 0), 0);
  const totalOut = ledger.filter((l) => l.direction === "OUT").reduce((acc, l) => acc + Number(l.amount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FINANCE / CASH FLOW LEDGER"
        title="สมุดรายวันและกระแสเงินสด (Cash Flow Ledger)"
        description="ติดตามการไหลเข้าและออกของกระแสเงินสดขององค์กรแบบเรียลไทม์ พร้อมยอดคงเหลือสะสม"
        breadcrumbs={[
          { label: "การเงิน", href: "/admin/enterprise/finance" },
          { label: "กระแสเงินสด" },
        ]}
      />

      <EnterpriseModuleNav tabs={FINANCE_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">รายการกระแสเงินสด ({ledger.length} รายการ)</h2>
            <div className="flex items-center space-x-4 text-xs font-bold mt-1">
              <span className="text-emerald-600">เงินสดรับเข้า: +฿{totalIn.toLocaleString()}</span>
              <span className="text-rose-600">เงินสดจ่ายออก: -฿{totalOut.toLocaleString()}</span>
              <span className="text-indigo-600">กระแสเงินสดสุทธิ: ฿{(totalIn - totalOut).toLocaleString()}</span>
            </div>
          </div>
          <span className="text-xs text-content-muted">MySQL Cash Ledger</span>
        </div>

        {ledger.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Layers className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการกระแสเงินสด</p>
            <p className="text-xs">ทุกการรับเงินและจ่ายชำระจะถูกบันทึกในสมุดรายวันเงินสดโดยอัตโนมัติ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่</th>
                  <th className="p-3">ประเภท</th>
                  <th className="p-3">คำอธิบายรายการ</th>
                  <th className="p-3">ทิศทาง</th>
                  <th className="p-3">จำนวนเงิน</th>
                  <th className="p-3 rounded-r-xl">ยอดคงเหลือ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {ledger.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-semibold">{new Date(item.entryDate).toLocaleDateString("th-TH")}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-content-primary">{item.description}</td>
                    <td className="p-3 font-bold">
                      <span className={item.direction === "IN" ? "text-emerald-600" : "text-rose-600"}>
                        {item.direction === "IN" ? "รับเข้า (+)" : "จ่ายออก (-)"}
                      </span>
                    </td>
                    <td className={`p-3 font-bold ${item.direction === "IN" ? "text-emerald-600" : "text-rose-600"}`}>
                      ฿{Number(item.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-indigo-600">
                      ฿{Number(item.balance || 0).toLocaleString()}
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
