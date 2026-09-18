import { prisma } from "@/lib/prisma";
import { Landmark, Calendar, DollarSign } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const TREASURY_TABS = [
  { label: "ภาพรวมบริหารเงิน", href: "/admin/enterprise/treasury" },
  { label: "สถานะสภาพคล่อง", href: "/admin/enterprise/treasury/cash-position" },
  { label: "ประมาณการเงินสด", href: "/admin/enterprise/treasury/forecast" },
  { label: "งบประมาณองค์กร", href: "/admin/enterprise/treasury/budget" },
];

export default async function TreasuryCashPositionPage() {
  const accounts = await prisma.cashLedgerEntry.findMany({
    orderBy: { entryDate: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="TREASURY / CASH POSITION"
        title="สถานะสภาพคล่องและเงินสดคงเหลือ (Cash Position)"
        description="รายงานสถานะเงินสดคงเหลือตามบัญชีธนาคาร และประวัติการเคลื่อนไหวของเงินทุนหมุนเวียน"
        breadcrumbs={[
          { label: "บริหารเงินสด", href: "/admin/enterprise/treasury" },
          { label: "สถานะสภาพคล่อง" },
        ]}
      />

      <EnterpriseModuleNav tabs={TREASURY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ประวัติการเคลื่อนไหวสภาพคล่อง ({accounts.length})</h2>
          <span className="text-xs text-content-muted">MySQL Cash Records</span>
        </div>

        {accounts.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Landmark className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อมูลสภาพคล่องในระบบ</p>
            <p className="text-xs">เมื่อมีการรับ-จ่ายเงิน ข้อมูลจะปรากฏที่นี่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่</th>
                  <th className="p-3">บัญชีธนาคาร</th>
                  <th className="p-3">รายการ</th>
                  <th className="p-3">จำนวนเงิน</th>
                  <th className="p-3 rounded-r-xl">ยอดคงเหลือสุทธิ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {accounts.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-semibold">{new Date(a.entryDate).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-bold text-content-primary">{a.bankAccount || "บัญชีกระแสรายวันหลัก"}</td>
                    <td className="p-3 text-content-secondary">{a.description}</td>
                    <td className={`p-3 font-bold ${a.direction === "IN" ? "text-emerald-600" : "text-rose-600"}`}>
                      {a.direction === "IN" ? "+" : "-"}฿{Number(a.amount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-indigo-600">
                      ฿{Number(a.balance || 0).toLocaleString()}
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
