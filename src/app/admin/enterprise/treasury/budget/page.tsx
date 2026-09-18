import { prisma } from "@/lib/prisma";
import { DollarSign, PieChart, CheckCircle2 } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const TREASURY_TABS = [
  { label: "ภาพรวมบริหารเงิน", href: "/admin/enterprise/treasury" },
  { label: "สถานะสภาพคล่อง", href: "/admin/enterprise/treasury/cash-position" },
  { label: "ประมาณการเงินสด", href: "/admin/enterprise/treasury/forecast" },
  { label: "งบประมาณองค์กร", href: "/admin/enterprise/treasury/budget" },
];

export default async function TreasuryBudgetPage() {
  const budgets = await prisma.budget.findMany({
    orderBy: { period: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="TREASURY / CORPORATE BUDGET"
        title="งบประมาณองค์กรและการจัดสรรเงินทุน (Corporate Budget)"
        description="การควบคุมการใช้งบประมาณรายหมวดหมู่ วงเงินที่อนุมัติ และเพดานการเบิกจ่าย"
        breadcrumbs={[
          { label: "บริหารเงินสด", href: "/admin/enterprise/treasury" },
          { label: "งบประมาณองค์กร" },
        ]}
      />

      <EnterpriseModuleNav tabs={TREASURY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">หมวดหมู่งบประมาณทั้งหมด ({budgets.length})</h2>
          <span className="text-xs text-content-muted">MySQL Budget Records</span>
        </div>

        {budgets.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <PieChart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อมูลงบประมาณในระบบ</p>
            <p className="text-xs">สามารถกำหนดงบประมาณสำหรับหน่วยงานหรือหมวดหมู่ค่าใช้จ่ายได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">งวดงบประมาณ</th>
                  <th className="p-3">หมวดหมู่</th>
                  <th className="p-3">วงเงินที่อนุมัติ</th>
                  <th className="p-3">เบิกใช้จริง</th>
                  <th className="p-3">ยอดคงเหลือ</th>
                  <th className="p-3 rounded-r-xl">การควบคุม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{b.period}</td>
                    <td className="p-3 font-bold text-content-primary">{b.category}</td>
                    <td className="p-3 font-semibold text-content-primary">฿{Number(b.budgetAmount || 0).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-rose-600">฿{Number(b.actualAmount || 0).toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-600">฿{Number(b.available || 0).toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                        {b.controlMode}
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
