import { prisma } from "@/lib/prisma";
import { DollarSign, PieChart, TrendingUp, AlertTriangle } from "lucide-react";
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

export default async function EnterpriseBudgetPage() {
  const budgets = await prisma.budget.findMany({
    orderBy: { createdAt: "desc" },
  });

  const totalAllocated = budgets.reduce((acc, b) => acc + Number(b.budgetAmount || 0), 0);
  const totalActual = budgets.reduce((acc, b) => acc + Number(b.actualAmount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE BUDGET CONTROL"
        title="การจัดสรรและควบคุมงบประมาณ (Budget Control)"
        description="ตรวจสอบการจัดสรรงบประมาณ การเบิกจ่ายจริง และวงเงินคงเหลือรายแผนก / ไซต์งาน"
        breadcrumbs={[
          { label: "โครงการ", href: "/admin/enterprise/projects" },
          { label: "งบประมาณ" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROJECT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">รายการจัดสรรงบประมาณ ({budgets.length})</h2>
            <div className="flex items-center space-x-4 text-xs font-bold mt-1">
              <span className="text-indigo-600">จัดสรรรวม: ฿{totalAllocated.toLocaleString()}</span>
              <span className="text-rose-600">ใช้จริง: ฿{totalActual.toLocaleString()}</span>
            </div>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {budgets.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <PieChart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อมูลงบประมาณในระบบ</p>
            <p className="text-xs">สามารถสร้างงบประมาณประจำงวดและกำหนดหมวดหมู่ค่าใช้จ่ายได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">งวดงบประมาณ</th>
                  <th className="p-3">หมวดหมู่</th>
                  <th className="p-3">งบประมาณจัดสรร</th>
                  <th className="p-3">ใช้ไปแล้ว</th>
                  <th className="p-3">คงเหลือ</th>
                  <th className="p-3 rounded-r-xl">โหมดควบคุม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {budgets.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{b.period}</td>
                    <td className="p-3 font-bold text-content-primary">{b.category}</td>
                    <td className="p-3 font-semibold text-content-primary">
                      ฿{Number(b.budgetAmount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-rose-600">
                      ฿{Number(b.actualAmount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(b.available || 0).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600">
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
