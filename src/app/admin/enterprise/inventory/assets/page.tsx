import { prisma } from "@/lib/prisma";
import { ShieldCheck, Calendar, DollarSign, Tag } from "lucide-react";
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

export default async function InventoryAssetsPage() {
  const assets = await prisma.asset.findMany({
    include: {
      _count: { select: { assignments: true, maintenances: true } },
    },
    orderBy: { code: "asc" },
  });

  const totalCost = assets.reduce((acc, a) => acc + Number(a.purchaseCost || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FIXED ASSETS MANAGEMENT"
        title="ทะเบียนสินทรัพย์ถาวร (Fixed Assets)"
        description="ทะเบียนสินทรัพย์ เครื่องจักร อุปกรณ์สำนักงาน มูลค่าจัดซื้อ และอัตราค่าเสื่อมราคา"
        breadcrumbs={[
          { label: "คลังสินค้า", href: "/admin/enterprise/inventory" },
          { label: "ทรัพย์สินถาวร" },
        ]}
      />

      <EnterpriseModuleNav tabs={INVENTORY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">รายการสินทรัพย์ทั้งหมด ({assets.length} รายการ)</h2>
            <p className="text-xs text-indigo-600 font-bold mt-0.5">มูลค่าจัดซื้อรวม: ฿{totalCost.toLocaleString()}</p>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {assets.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการสินทรัพย์ถาวร</p>
            <p className="text-xs">สามารถบันทึกรหัสทรัพย์สิน ยี่ห้อ รุ่น และ Serial No. ได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">รหัสทรัพย์สิน</th>
                  <th className="p-3">ชื่อสินทรัพย์</th>
                  <th className="p-3">หมวดหมู่ / ยี่ห้อ</th>
                  <th className="p-3">Serial No.</th>
                  <th className="p-3">มูลค่าจัดซื้อ</th>
                  <th className="p-3">ประวัติการมอบหมาย</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {assets.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{a.code}</td>
                    <td className="p-3 font-bold text-content-primary">{a.name}</td>
                    <td className="p-3 text-content-secondary">
                      {a.category} {a.brand && `· ${a.brand}`}
                    </td>
                    <td className="p-3 font-mono text-content-muted">{a.serialNo || "-"}</td>
                    <td className="p-3 font-bold text-emerald-600">
                      ฿{Number(a.purchaseCost || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-content-secondary">
                      มอบหมาย: {a._count.assignments} ครั้ง · ซ่อม: {a._count.maintenances} ครั้ง
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {a.status}
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
