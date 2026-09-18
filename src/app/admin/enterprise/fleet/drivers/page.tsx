import { prisma } from "@/lib/prisma";
import { Users, Phone, MapPin, CheckCircle2, Truck } from "lucide-react";
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

export default async function FleetDriversPage() {
  const drivers = await prisma.employee.findMany({
    where: {
      isActive: true,
      OR: [
        { position: { contains: "ขับ" } },
        { position: { contains: "Driver" } },
        { drivenTrips: { some: {} } },
      ],
    },
    include: {
      site: { select: { name: true } },
      _count: { select: { drivenTrips: true } },
    },
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FLEET / DRIVERS"
        title="พนักงานขับรถและผู้ถือใบขับขี่ (Drivers)"
        description="รายชื่อพนักงานขับรถประจำหน่วยงาน ไซต์งาน และสถิติทริปการปฏิบัติงาน"
        breadcrumbs={[
          { label: "ฟลีทและขนส่ง", href: "/admin/enterprise/fleet" },
          { label: "พนักงานขับรถ" },
        ]}
      />

      <EnterpriseModuleNav tabs={FLEET_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">พนักงานขับรถทั้งหมด ({drivers.length} คน)</h2>
          <span className="text-xs text-content-muted">MySQL Workforce Database</span>
        </div>

        {drivers.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีพนักงานขับรถในระบบ</p>
            <p className="text-xs">สามารถกำหนดตำแหน่งพนักงานเป็นพนักงานขับรถ หรือมอบหมายทริปเพื่อบันทึกสถิติ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((d) => (
              <div key={d.id} className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-md">
                      {d.code}
                    </span>
                    <h3 className="text-sm font-bold text-content-primary mt-1">
                      {d.prefix || ""} {d.firstName} {d.lastName}
                    </h3>
                    <p className="text-xs text-content-muted">{d.position}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                    Active
                  </span>
                </div>

                <div className="text-xs text-content-secondary space-y-1 pt-2 border-t border-surface-border/50">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>สังกัด: {d.site?.name || "ไม่ระบุ"}</span>
                  </div>
                  {d.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{d.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 pt-2 border-t border-surface-border/50">
                  <span>สถิติทริปการขับ</span>
                  <span>{d._count.drivenTrips} ทริป</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
