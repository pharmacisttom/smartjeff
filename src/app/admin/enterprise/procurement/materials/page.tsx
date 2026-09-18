import { prisma } from "@/lib/prisma";
import { Package, Tag, DollarSign } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const PROCUREMENT_TABS = [
  { label: "ภาพรวมจัดซื้อ", href: "/admin/enterprise/procurement" },
  { label: "รายการพัสดุ & วัสดุ", href: "/admin/enterprise/procurement/materials" },
  { label: "ใบขอซื้อ (PR)", href: "/admin/enterprise/procurement/pr" },
  { label: "ขอใบเสนอราคา (RFQ)", href: "/admin/enterprise/procurement/rfq" },
  { label: "ใบเสนอราคาคู่ค้า", href: "/admin/enterprise/procurement/supplier-quotes" },
  { label: "ใบสั่งซื้อ (PO)", href: "/admin/enterprise/procurement/po" },
  { label: "ตรวจรับพัสดุ (GR)", href: "/admin/enterprise/procurement/gr" },
];

export default async function ProcurementMaterialsPage() {
  const materials = await prisma.inventoryItem.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="PROCUREMENT / MASTER MATERIALS"
        title="รายการพัสดุและวัสดุก่อสร้าง (Materials & Items)"
        description="ทะเบียนรหัสพัสดุ หน่วยนับ ราคาต่อหน่วย และจุดสั่งซื้อซ้ำ (Reorder Point)"
        breadcrumbs={[
          { label: "จัดซื้อ", href: "/admin/enterprise/procurement" },
          { label: "รายการพัสดุ & วัสดุ" },
        ]}
      />

      <EnterpriseModuleNav tabs={PROCUREMENT_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ทะเบียนพัสดุทั้งหมด ({materials.length} รายการ)</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {materials.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Package className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีรายการพัสดุในระบบ</p>
            <p className="text-xs">สามารถเพิ่มรหัสพัสดุ หมวดหมู่ และหน่วยนับได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">รหัสพัสดุ</th>
                  <th className="p-3">ชื่อรายการ</th>
                  <th className="p-3">หมวดหมู่</th>
                  <th className="p-3">หน่วยนับ</th>
                  <th className="p-3">ราคาประเมิน / หน่วย</th>
                  <th className="p-3">ยอดคงคลัง</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {materials.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{m.code}</td>
                    <td className="p-3 font-bold text-content-primary">{m.name}</td>
                    <td className="p-3 text-content-secondary">{m.category || "ทั่วไป"}</td>
                    <td className="p-3 text-content-muted">{m.unit}</td>
                    <td className="p-3 font-semibold text-content-primary">
                      ฿{Number(m.unitCost || 0).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-indigo-600">{m.stockBalance} {m.unit}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.isActive ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-200 text-slate-500"
                      }`}>
                        {m.isActive ? "พร้อมสั่ง" : "ปิดการสั่ง"}
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
