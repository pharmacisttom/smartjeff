import { prisma } from "@/lib/prisma";
import { DollarSign, Calendar, Tag, Briefcase } from "lucide-react";
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

export default async function EnterpriseCostsPage() {
  const costs = await prisma.projectCost.findMany({
    include: {
      project: { select: { name: true, code: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  const totalCost = costs.reduce((acc, c) => acc + Number(c.amount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="PROJECT COST ACCOUNTING"
        title="บันทึกและวิเคราะห์ต้นทุนโครงการ (Project Costs)"
        description="ติดตามค่าใช้จ่ายจริงรายโครงการ ทั้งค่าแรงงาน ค่าวัสดุ ค่าเชื้อเพลิง และค่าโสหุ้ย"
        breadcrumbs={[
          { label: "โครงการ", href: "/admin/enterprise/projects" },
          { label: "ต้นทุนโครงการ" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROJECT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">บันทึกต้นทุนโครงการ ({costs.length} รายการ)</h2>
            <p className="text-xs text-rose-600 font-bold mt-0.5">รวมค่าใช้จ่าย: ฿{totalCost.toLocaleString()}</p>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {costs.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <DollarSign className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีบันทึกต้นทุนในระบบ</p>
            <p className="text-xs">ต้นทุนจะถูกบันทึกเมื่อมีการจ่ายค่าแรง สั่งซื้อ หรือใช้งานอุปกรณ์</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่</th>
                  <th className="p-3">โครงการ</th>
                  <th className="p-3">ประเภทต้นทุน</th>
                  <th className="p-3">รายละเอียด</th>
                  <th className="p-3 rounded-r-xl">จำนวนเงิน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {costs.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-semibold">{new Date(c.date).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-bold text-content-primary">{c.project?.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        {c.type}
                      </span>
                    </td>
                    <td className="p-3 text-content-secondary">{c.description}</td>
                    <td className="p-3 font-bold text-rose-600">
                      ฿{Number(c.amount || 0).toLocaleString()}
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
