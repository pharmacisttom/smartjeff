import { prisma } from "@/lib/prisma";
import { Package, Calendar, Users, CheckCircle2 } from "lucide-react";
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

export default async function InventoryRequisitionsPage() {
  const issueMovements = await prisma.stockMovement.findMany({
    where: { type: { in: ["OUT", "ISSUE", "REQUISITION"] } },
    include: {
      item: { select: { name: true, code: true, unit: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="INVENTORY / REQUISITIONS"
        title="เบิกจ่ายพัสดุและวัสดุใช้งาน (Material Requisitions)"
        description="ติดตามประวัติการเบิกใช้วัสดุสิ้นเปลือง อุปกรณ์เซฟตี้ และอะไหล่สำหรับงานโครงการ"
        breadcrumbs={[
          { label: "คลังสินค้า", href: "/admin/enterprise/inventory" },
          { label: "เบิกจ่ายพัสดุ" },
        ]}
      />

      <EnterpriseModuleNav tabs={INVENTORY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการเบิกจ่ายพัสดุทั้งหมด ({issueMovements.length})</h2>
          <span className="text-xs text-content-muted">MySQL Issue Records</span>
        </div>

        {issueMovements.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการเบิกจ่ายพัสดุ</p>
            <p className="text-xs">เมื่อเจ้าหน้าที่ไซต์งานเบิกวัสดุ รายการตัดสต็อกจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่เบิก</th>
                  <th className="p-3">รหัส / รายการพัสดุ</th>
                  <th className="p-3">จำนวนที่เบิก</th>
                  <th className="p-3">ยอดคงเหลือในคลัง</th>
                  <th className="p-3 rounded-r-xl">วัตถุประสงค์ / โครงการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {issueMovements.map((im) => (
                  <tr key={im.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-semibold">{new Date(im.createdAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-bold text-content-primary">
                      {im.item?.name}
                      <span className="block text-[10px] text-content-muted">{im.item?.code}</span>
                    </td>
                    <td className="p-3 font-bold text-rose-600">
                      -{im.quantity} {im.item?.unit}
                    </td>
                    <td className="p-3 font-bold text-indigo-600">
                      {im.balanceAfter} {im.item?.unit}
                    </td>
                    <td className="p-3 text-content-secondary max-w-xs truncate">{im.notes || "เบิกใช้งานทั่วไป"}</td>
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
