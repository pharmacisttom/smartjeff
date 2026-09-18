import { prisma } from "@/lib/prisma";
import { Layers, Calendar, ArrowDownRight, ArrowUpRight } from "lucide-react";
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

export default async function InventoryMovementsPage() {
  const movements = await prisma.stockMovement.findMany({
    include: {
      item: { select: { name: true, code: true, unit: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="INVENTORY / STOCK MOVEMENTS"
        title="ประวัติการเคลื่อนไหวสต็อก (Stock Movement Ledger)"
        description="สมุดบัญชีคุมสต็อก รับเข้า จ่ายออก โอนย้าย และปรับปรุงยอดสินค้าคงเหลือ"
        breadcrumbs={[
          { label: "คลังสินค้า", href: "/admin/enterprise/inventory" },
          { label: "การเคลื่อนไหวสต็อก" },
        ]}
      />

      <EnterpriseModuleNav tabs={INVENTORY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการเคลื่อนไหวสต็อก ({movements.length})</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {movements.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Layers className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการเคลื่อนไหวสต็อก</p>
            <p className="text-xs">เมื่อมีการตรวจรับหรือเบิกจ่าย รายการความเคลื่อนไหวจะถูกบันทึกอัตโนมัติ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่</th>
                  <th className="p-3">รหัสพัสดุ</th>
                  <th className="p-3">ชื่อรายการ</th>
                  <th className="p-3">ประเภท</th>
                  <th className="p-3">จำนวน</th>
                  <th className="p-3">คงเหลือหลังทำรายการ</th>
                  <th className="p-3 rounded-r-xl">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-semibold">{new Date(m.createdAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-mono font-bold text-brand-600">{m.item?.code}</td>
                    <td className="p-3 font-bold text-content-primary">{m.item?.name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.type === "IN" || m.type === "RECEIPT"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-content-primary">
                      {m.quantity} {m.item?.unit}
                    </td>
                    <td className="p-3 font-bold text-indigo-600">
                      {m.balanceAfter} {m.item?.unit}
                    </td>
                    <td className="p-3 text-content-secondary max-w-xs truncate">{m.notes || "-"}</td>
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
