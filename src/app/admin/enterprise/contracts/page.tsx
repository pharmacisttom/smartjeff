import { prisma } from "@/lib/prisma";
import { FileCheck, Calendar, DollarSign, Building2 } from "lucide-react";
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

export default async function EnterpriseContractsPage() {
  const contracts = await prisma.contract.findMany({
    include: {
      client: { select: { name: true, code: true } },
      project: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalContractValue = contracts.reduce((acc, c) => acc + Number(c.value || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="CONTRACTS MANAGEMENT"
        title="สัญญาจ้างและข้อตกลงโครงการ (Contracts)"
        description="ทะเบียนสัญญาจ้าง มูลค่าสัญญา วันที่เริ่มต้น-สิ้นสุด และเงื่อนไขข้อตกลง"
        breadcrumbs={[
          { label: "โครงการ", href: "/admin/enterprise/projects" },
          { label: "สัญญาโครงการ" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROJECT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">ทะเบียนสัญญาทั้งหมด ({contracts.length})</h2>
            <p className="text-xs text-emerald-600 font-bold mt-0.5">มูลค่าสัญญารวม: ฿{totalContractValue.toLocaleString()}</p>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {contracts.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <FileCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีสัญญาในระบบ</p>
            <p className="text-xs">สามารถบันทึกสัญญาโครงการใหม่และผูกกับโครงการได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่สัญญา</th>
                  <th className="p-3">ชื่อสัญญา</th>
                  <th className="p-3">ลูกค้า / โครงการ</th>
                  <th className="p-3">มูลค่าสัญญา</th>
                  <th className="p-3">ระยะเวลาสัญญา</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {contracts.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {c.refNo || c.id.slice(0, 8)}
                    </td>
                    <td className="p-3 font-bold text-content-primary">{c.title}</td>
                    <td className="p-3 text-content-secondary">
                      <span className="font-semibold">{c.client?.name || "-"}</span>
                      {c.project && <span className="block text-[10px] text-content-muted">{c.project.name}</span>}
                    </td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(c.value || 0).toLocaleString()} {c.currency}
                    </td>
                    <td className="p-3 text-content-muted">
                      {c.startDate ? new Date(c.startDate).toLocaleDateString("th-TH") : "-"} ถึง{" "}
                      {c.endDate ? new Date(c.endDate).toLocaleDateString("th-TH") : "-"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : c.status === "SIGNED"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {c.status}
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
