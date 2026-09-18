import { prisma } from "@/lib/prisma";
import { Wrench, Calendar, DollarSign, Truck } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const FLEET_TABS = [
  { label: "ภาพรวมฟลีท", href: "/admin/enterprise/fleet" },
  { label: "ยานพาหนะ", href: "/admin/enterprise/fleet/vehicles" },
  { label: "พนักงานขับรถ", href: "/admin/enterprise/fleet/drivers" },
  { label: "การเดินทาง (Trips)", href: "/admin/enterprise/fleet/trips" },
  { label: "จัดคิวเดินรถ (Dispatch)", href: "/admin/enterprise/fleet/dispatch" },
  { label: "บันทึกน้ำมัน", href: "/admin/enterprise/fleet/fuel" },
  { label: "ซ่อมบำรุงรถ", href: "/admin/enterprise/fleet/maintenance" },
];

export default async function FleetMaintenancePage() {
  const maintenances = await prisma.vehicleMaintenance.findMany({
    include: {
      vehicle: { select: { plateNo: true, brand: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalCost = maintenances.reduce((acc, m) => acc + Number(m.cost || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FLEET / MAINTENANCE & REPAIR"
        title="บันทึกและประวัติซ่อมบำรุงยานพาหนะ (Vehicle Maintenance)"
        description="ประวัติการตรวจเช็กระยะ เปลี่ยนถ่ายน้ำมันเครื่อง และการซ่อมแซมยานพาหนะ"
        breadcrumbs={[
          { label: "ฟลีทและขนส่ง", href: "/admin/enterprise/fleet" },
          { label: "ซ่อมบำรุงรถ" },
        ]}
      />

      <EnterpriseModuleNav tabs={FLEET_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">ประวัติการซ่อมบำรุง ({maintenances.length} ครั้ง)</h2>
            <p className="text-xs text-rose-600 font-bold mt-0.5">รวมค่าซ่อมบำรุง: ฿{totalCost.toLocaleString()}</p>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {maintenances.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Wrench className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีประวัติการซ่อมบำรุง</p>
            <p className="text-xs">สามารถบันทึกการส่งซ่อม เปลี่ยนถ่ายของเหลว หรืออะไหล่ได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่นัด / เสร็จสิ้น</th>
                  <th className="p-3">ทะเบียนรถ</th>
                  <th className="p-3">ประเภทการซ่อม</th>
                  <th className="p-3">รายละเอียด</th>
                  <th className="p-3">อู่ / ศูนย์บริการ</th>
                  <th className="p-3 rounded-r-xl">ค่าใช้จ่าย</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {maintenances.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 text-content-secondary font-medium">
                      {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString("th-TH") : "-"}
                    </td>
                    <td className="p-3 font-bold text-content-primary">{m.vehicle?.plateNo}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                        {m.type}
                      </span>
                    </td>
                    <td className="p-3 text-content-primary">{m.description}</td>
                    <td className="p-3 text-content-muted">{m.vendor || "-"}</td>
                    <td className="p-3 font-bold text-rose-600">
                      ฿{Number(m.cost || 0).toLocaleString()}
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
