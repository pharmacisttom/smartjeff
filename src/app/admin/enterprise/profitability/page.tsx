import { prisma } from "@/lib/prisma";
import { TrendingUp, DollarSign, PieChart, CheckCircle2 } from "lucide-react";
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

export default async function EnterpriseProfitabilityPage() {
  const projects = await prisma.project.findMany({
    include: {
      client: { select: { name: true } },
    },
    orderBy: { budgetAmount: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="PROFITABILITY & MARGINS"
        title="วิเคราะห์ความสามารถในการทำกำไร (Project Profitability)"
        description="เปรียบเทียบงบประมาณ รายได้ และต้นทุนเกิดขึ้นจริง เพื่อวิเคราะห์อัตรากำไร (Profit Margin) รายโครงการ"
        breadcrumbs={[
          { label: "โครงการ", href: "/admin/enterprise/projects" },
          { label: "วิเคราะห์ความสามารถทำกำไร" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROJECT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ตารางอัตรากำไรรายโครงการ ({projects.length})</h2>
          <span className="text-xs text-content-muted">MySQL Financial Data</span>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <PieChart className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อมูลโครงการสำหรับวิเคราะห์กำไร</p>
            <p className="text-xs">เมื่อมีการสร้างโครงการและบันทึกต้นทุน ข้อมูลอัตรากำไรจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">โครงการ</th>
                  <th className="p-3">ลูกค้า</th>
                  <th className="p-3">งบประมาณโครงการ</th>
                  <th className="p-3">ต้นทุนจริง</th>
                  <th className="p-3">กำไรขั้นต้น (Est. Profit)</th>
                  <th className="p-3 rounded-r-xl">อัตรากำไร (% Margin)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {projects.map((p) => {
                  const budget = Number(p.budgetAmount || 0);
                  const actual = Number(p.actualCost || 0);
                  const profit = budget - actual;
                  const marginPercent = budget > 0 ? ((profit / budget) * 100).toFixed(1) : "0.0";
                  const isPositive = profit >= 0;

                  return (
                    <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="p-3 font-bold text-content-primary">
                        <span className="font-mono text-brand-600 block text-[10px]">{p.code}</span>
                        {p.name}
                      </td>
                      <td className="p-3 text-content-secondary">{p.client?.name || "-"}</td>
                      <td className="p-3 font-semibold text-content-primary">฿{budget.toLocaleString()}</td>
                      <td className="p-3 font-semibold text-rose-600">฿{actual.toLocaleString()}</td>
                      <td className={`p-3 font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                        ฿{profit.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isPositive
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}>
                          {marginPercent}%
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
