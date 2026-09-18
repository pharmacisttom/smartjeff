import { prisma } from "@/lib/prisma";
import { Navigation, Clock, Truck, Users, Plus } from "lucide-react";
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

export default async function FleetDispatchPage() {
  const [plannedTrips, availableVehicles, drivers] = await Promise.all([
    prisma.trip.findMany({
      where: { status: { in: ["PLANNED", "DISPATCHED", "IN_PROGRESS"] } },
      include: {
        vehicle: { select: { plateNo: true, brand: true, status: true } },
        driver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.vehicle.findMany({ where: { status: "AVAILABLE", isActive: true } }),
    prisma.employee.findMany({ where: { isActive: true, position: { contains: "ขับ" } }, take: 10 }),
  ]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FLEET / DISPATCH CONTROL"
        title="จัดคิวเดินรถและการมอบหมาย (Fleet Dispatch)"
        description="ศูนย์ควบคุมการจัดสรรยานพาหนะ มอบหมายคนขับ และกำหนดคิวรับ-ส่งงานหน้างาน"
        breadcrumbs={[
          { label: "ฟลีทและขนส่ง", href: "/admin/enterprise/fleet" },
          { label: "จัดคิวเดินรถ (Dispatch)" },
        ]}
      />

      <EnterpriseModuleNav tabs={FLEET_TABS} />

      {/* Dispatch Overview Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-1 shadow-sm">
          <span className="text-xs text-content-muted font-bold">คิวเดินรถที่รอปฏิบัติ</span>
          <div className="text-3xl font-black text-brand-600">{plannedTrips.length} งาน</div>
          <p className="text-[11px] text-content-muted">สถานะ Planned / In Progress</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-1 shadow-sm">
          <span className="text-xs text-content-muted font-bold">รถว่างพร้อมจัดสรร</span>
          <div className="text-3xl font-black text-emerald-600">{availableVehicles.length} คัน</div>
          <p className="text-[11px] text-emerald-600 font-bold">Status: AVAILABLE</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-1 shadow-sm">
          <span className="text-xs text-content-muted font-bold">พนักงานขับรถประจำการ</span>
          <div className="text-3xl font-black text-indigo-600">{drivers.length} คน</div>
          <p className="text-[11px] text-content-muted">พร้อมรับภารกิจ</p>
        </div>
      </div>

      {/* Dispatch Active Queue Table */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">คิวเดินรถที่รอปล่อยตัว & กำลังวิ่ง (Active Queue)</h2>
          <span className="text-xs text-content-muted">Real-time Dispatch</span>
        </div>

        {plannedTrips.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Truck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ไม่มีคิวเดินรถตกค้างในขณะนี้</p>
            <p className="text-xs">สามารถสร้างแผนการเดินรถและจัดคิวล่วงหน้าได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่งาน</th>
                  <th className="p-3">เวลานัดหมาย</th>
                  <th className="p-3">ภารกิจ</th>
                  <th className="p-3">ยานพาหนะ</th>
                  <th className="p-3">คนขับ</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {plannedTrips.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{t.refNo || t.id.slice(0, 8)}</td>
                    <td className="p-3 text-content-secondary font-medium">
                      {t.scheduledAt ? new Date(t.scheduledAt).toLocaleString("th-TH") : "ทันที"}
                    </td>
                    <td className="p-3 font-bold text-content-primary">{t.purpose}</td>
                    <td className="p-3 text-content-secondary font-bold">{t.vehicle?.plateNo}</td>
                    <td className="p-3 text-content-secondary">
                      {t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : "ยังไม่มอบหมาย"}
                    </td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
                        {t.status}
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
