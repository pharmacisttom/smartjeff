import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Building2, TrendingDown, ArrowRight, ShieldCheck, Wrench, Layers } from "lucide-react";
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

export default async function EnterpriseInventoryPage() {
  const [items, movements, assets, sites] = await Promise.all([
    prisma.inventoryItem.findMany({ where: { isActive: true } }),
    prisma.stockMovement.findMany({
      include: { item: { select: { name: true, code: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.asset.findMany({ where: { isActive: true } }),
    prisma.site.count(),
  ]);

  const totalInventoryValue = items.reduce((acc, it) => acc + Number(it.unitCost || 0) * (it.stockBalance || 0), 0);
  const totalAssetValue = assets.reduce((acc, a) => acc + Number(a.purchaseCost || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE INVENTORY & ASSETS"
        title="คลังสินค้าและสินทรัพย์ถาวร (Inventory & Assets)"
        description="บริหารสต็อกพัสดุ วัสดุสิ้นเปลือง การรับเข้า-เบิกจ่าย และการถือครองสินทรัพย์/เครื่องมือช่าง"
        breadcrumbs={[{ label: "คลังสินค้า & อุปกรณ์" }]}
      />

      <EnterpriseModuleNav tabs={INVENTORY_TABS} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>รายการพัสดุในคลัง</span>
            <Package className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{items.length} รายการ</div>
          <p className="text-[11px] text-content-muted">กระจายตามไซต์งาน</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>มูลค่าสต็อกรวม</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600">฿{totalInventoryValue.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">คำนวณตาม Unit Cost</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>สินทรัพย์ถาวร (Assets)</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{assets.length} ชิ้น</div>
          <p className="text-[11px] text-emerald-600 font-bold">฿{totalAssetValue.toLocaleString()}</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>คลัง/ไซต์เก็บของ</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{sites} แห่ง</div>
          <p className="text-[11px] text-content-muted">Sites & Hubs</p>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/enterprise/inventory/warehouses"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Building2 className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">คลังสินค้าประจำไซต์ (Warehouses)</h3>
          <p className="text-xs text-content-muted mt-1">ตรวจสอบยอดสต็อกแยกรายไซต์งานและคลังกลาง</p>
        </Link>

        <Link
          href="/admin/enterprise/inventory/movements"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Layers className="w-6 h-6 text-indigo-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">การเคลื่อนไหวสต็อก (Stock Movements)</h3>
          <p className="text-xs text-content-muted mt-1">ประวัติการรับเข้า เบิกจ่าย โอนย้าย และปรับยอดสต็อก</p>
        </Link>

        <Link
          href="/admin/enterprise/inventory/tools"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Wrench className="w-6 h-6 text-amber-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">เครื่องมือและอุปกรณ์ช่าง (Tools)</h3>
          <p className="text-xs text-content-muted mt-1">ติดตามการยืม-คืน อุปกรณ์ช่าง เครื่องมือไฟฟ้า และการบำรุงรักษา</p>
        </Link>
      </div>

      {/* Recent Movements Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">การเคลื่อนไหวสต็อกล่าสุด (Recent Stock Movements)</h2>
          <Link href="/admin/enterprise/inventory/movements" className="text-xs font-bold text-brand-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>

        {movements.length === 0 ? (
          <div className="p-8 text-center text-content-muted text-xs">ยังไม่มีประวัติการเคลื่อนไหวสต็อก</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่</th>
                  <th className="p-3">รหัส / พัสดุ</th>
                  <th className="p-3">ประเภทการเคลื่อนไหว</th>
                  <th className="p-3">จำนวน</th>
                  <th className="p-3">ยอดคงเหลือหลังทำรายการ</th>
                  <th className="p-3 rounded-r-xl">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-semibold">{new Date(m.createdAt).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-bold text-content-primary">
                      {m.item?.name}
                      <span className="block text-[10px] text-content-muted">{m.item?.code}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.type === "IN" || m.type === "RECEIPT"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600"
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-content-primary">{m.quantity}</td>
                    <td className="p-3 font-bold text-indigo-600">{m.balanceAfter}</td>
                    <td className="p-3 text-content-secondary truncate max-w-xs">{m.notes || "-"}</td>
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
