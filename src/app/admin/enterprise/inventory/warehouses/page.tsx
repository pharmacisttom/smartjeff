import { prisma } from "@/lib/prisma";
import { Building2, Package, MapPin, Users } from "lucide-react";
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

export default async function InventoryWarehousesPage() {
  const sites = await prisma.site.findMany({
    include: {
      _count: { select: { employees: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="INVENTORY / WAREHOUSES & SITES"
        title="คลังสินค้าและจุดจัดเก็บประจำไซต์ (Warehouses & Hubs)"
        description="รายชื่อคลังสินค้า คลังพัสดุย่อยประจำโรงงาน และสถานะการจัดเก็บ"
        breadcrumbs={[
          { label: "คลังสินค้า", href: "/admin/enterprise/inventory" },
          { label: "คลังสินค้า & ไซต์" },
        ]}
      />

      <EnterpriseModuleNav tabs={INVENTORY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">คลังจัดเก็บและไซต์งานทั้งหมด ({sites.length} แห่ง)</h2>
          <span className="text-xs text-content-muted">MySQL Site Models</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sites.map((s) => (
            <div key={s.id} className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-md">
                    {s.code}
                  </span>
                  <h3 className="font-bold text-sm text-content-primary mt-1">{s.name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                  Active
                </span>
              </div>

              <div className="text-xs text-content-secondary space-y-1.5 border-t border-surface-border/50 pt-2">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{s.location || "นิคมอุตสาหกรรม"}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>พนักงานประจำไซต์: {s._count.employees} คน</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 pt-2 border-t border-surface-border/50">
                <span>รัศมี Geofence คลัง</span>
                <span>{s.radius} เมตร</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
