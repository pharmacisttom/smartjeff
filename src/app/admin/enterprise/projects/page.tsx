import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Briefcase, Calendar, DollarSign, Clock, Users, ArrowRight } from "lucide-react";
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

export default async function EnterpriseProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      client: { select: { name: true, code: true } },
      _count: { select: { milestones: true, workOrders: true, costs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalBudget = projects.reduce((acc, p) => acc + Number(p.budgetAmount || 0), 0);
  const totalActual = projects.reduce((acc, p) => acc + Number(p.actualCost || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="PROJECT & CONTRACT MANAGEMENT"
        title="การบริหารโครงการและสัญญา (Projects & Contracts)"
        description="ติดตามความคืบหน้าโครงการ งบประมาณ ต้นทุนจริง และเอกสารสัญญาจ้าง"
        breadcrumbs={[{ label: "โครงการและสัญญา" }]}
      />

      <EnterpriseModuleNav tabs={PROJECT_TABS} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>โครงการทั้งหมด</span>
            <Briefcase className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{projects.length} โครงการ</div>
          <p className="text-[11px] text-content-muted">บันทึกใน MySQL</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>งบประมาณรวม</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">฿{totalBudget.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">งบประมาณที่จัดสรร</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ต้นทุนเกิดขึ้นจริง</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">฿{totalActual.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">Actual Cost ทั้งหมด</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>คงเหลืองบประมาณ</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">฿{(totalBudget - totalActual).toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">Budget Balance</p>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการโครงการ (Project Portfolio)</h2>
          <span className="text-xs text-content-muted">แสดง {projects.length} โครงการ</span>
        </div>

        {projects.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Briefcase className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีโครงการในระบบ</p>
            <p className="text-xs">สามารถสร้างโครงการและกำหนดงบประมาณได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">รหัส / ชื่อโครงการ</th>
                  <th className="p-3">ลูกค้า</th>
                  <th className="p-3">งบประมาณ</th>
                  <th className="p-3">ต้นทุนจริง</th>
                  <th className="p-3">งานหน้างาน / บันทึกต้นทุน</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-bold text-content-primary">
                      <span className="font-mono text-brand-600 block text-[10px]">{p.code}</span>
                      {p.name}
                    </td>
                    <td className="p-3 text-content-secondary">{p.client?.name || "-"}</td>
                    <td className="p-3 font-semibold text-content-primary">
                      ฿{Number(p.budgetAmount || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-rose-600">
                      ฿{Number(p.actualCost || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-content-muted">
                      WO: {p._count.workOrders} · Cost Records: {p._count.costs}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : p.status === "COMPLETED"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
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
