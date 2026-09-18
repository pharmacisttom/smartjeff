import { prisma } from "@/lib/prisma";
import { Wrench, Calendar, Users, CheckCircle2 } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const INVENTORY_TABS = [
  { label: "ภาพรวมคลังสินค้า", href: "/admin/enterprise/inventory" },
  { label: "คลังสินค้า & ไซต์", href: "/admin/enterprise/inventory/warehouses" },
  { label: "การเคลื่อนไหวสต็อก", href: "/admin/enterprise/inventory/movements" },
  { label: "เบิกจ่ายพัสดุ", href: "/admin/enterprise/inventory/requisitions" },
  { label: "ทรัพย์สินถาวร (Assets)", href: "/admin/enterprise/inventory/assets" },
  { label: "เครื่องมือ & อุปกรณ์ช่าง", href: "/admin/enterprise/inventory/tools" },
];

export default async function InventoryToolsPage() {
  const assignments = await prisma.assetAssignment.findMany({
    include: {
      asset: { select: { name: true, code: true, category: true } },
    },
    orderBy: { assignedAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="TOOLS & EQUIPMENT CONTROL"
        title="เครื่องมือและอุปกรณ์ช่าง (Tools & Equipment Tracking)"
        description="ติดตามการยืม-คืน เครื่องมือช่าง เครื่องมือวัด และอุปกรณ์ความปลอดภัยรายบุคคล"
        breadcrumbs={[
          { label: "คลังสินค้า", href: "/admin/enterprise/inventory" },
          { label: "เครื่องมือ & อุปกรณ์ช่าง" },
        ]}
      />

      <EnterpriseModuleNav tabs={INVENTORY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ประวัติการถือครองเครื่องมือ ({assignments.length} รายการ)</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {assignments.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Wrench className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีบันทึกการถือครองเครื่องมือ</p>
            <p className="text-xs">สามารถบันทึกการมอบหมายอุปกรณ์ช่างให้แก่พนักงานหรือไซต์งานได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่มอบหมาย</th>
                  <th className="p-3">รหัส / ชื่อเครื่องมือ</th>
                  <th className="p-3">หมวดหมู่</th>
                  <th className="p-3">สภาพเครื่องมือ</th>
                  <th className="p-3">วันที่ส่งคืน</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {assignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-semibold">{new Date(asg.assignedAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-bold text-content-primary">
                      {asg.asset.name}
                      <span className="block text-[10px] text-brand-600 font-mono">{asg.asset.code}</span>
                    </td>
                    <td className="p-3 text-content-secondary">{asg.asset.category}</td>
                    <td className="p-3 font-medium text-content-secondary">{asg.condition}</td>
                    <td className="p-3 text-content-muted">
                      {asg.returnedAt ? new Date(asg.returnedAt).toLocaleDateString("th-TH") : "กำลังถือครอง"}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        asg.returnedAt
                          ? "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          : "bg-emerald-500/10 text-emerald-600"
                      }`}>
                        {asg.returnedAt ? "คืนแล้ว" : "อยู่ระหว่างใช้งาน"}
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
