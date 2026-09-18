import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Truck, Navigation, Fuel, Wrench, Users, ArrowRight } from "lucide-react";
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

export default async function EnterpriseFleetOverviewPage() {
  const [vehicles, trips, fuelRecords, maintenanceCount] = await Promise.all([
    prisma.vehicle.findMany({ where: { isActive: true } }),
    prisma.trip.findMany({
      include: {
        vehicle: { select: { plateNo: true, brand: true, model: true } },
        driver: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.fuelRecord.findMany({ take: 20 }),
    prisma.vehicleMaintenance.count(),
  ]);

  const totalFuelCost = fuelRecords.reduce((acc, f) => acc + Number(f.totalCost || 0), 0);
  const activeVehicles = vehicles.filter((v) => v.status === "AVAILABLE" || v.status === "ON_TRIP").length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="ENTERPRISE FLEET & LOGISTICS"
        title="ระบบบริหารยานพาหนะและการขนส่ง (Fleet & Logistics)"
        description="ติดตามยานพาหนะ บันทึกทริปเดินทาง จัดคิวเดินรถ บันทึกการใช้น้ำมัน และการบำรุงรักษา"
        breadcrumbs={[{ label: "ยานพาหนะและทริป (Fleet)" }]}
      />

      <EnterpriseModuleNav tabs={FLEET_TABS} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ยานพาหนะทั้งหมด</span>
            <Truck className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{vehicles.length} คัน</div>
          <p className="text-[11px] text-emerald-600 font-bold">พร้อมใช้งาน {activeVehicles} คัน</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ทริปการเดินทาง</span>
            <Navigation className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{trips.length} ทริป</div>
          <p className="text-[11px] text-content-muted">บันทึกใน MySQL</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ค่าน้ำมันเชื้อเพลิง</span>
            <Fuel className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">฿{totalFuelCost.toLocaleString()}</div>
          <p className="text-[11px] text-content-muted">ยอดเติมล่าสุด</p>
        </div>
        <div className="bg-surface-card border border-surface-border rounded-3xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-content-muted font-bold">
            <span>ประวัติซ่อมบำรุง</span>
            <Wrench className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-content-primary">{maintenanceCount} ครั้ง</div>
          <p className="text-[11px] text-content-muted">Vehicle Maintenance</p>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/enterprise/fleet/vehicles"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Truck className="w-6 h-6 text-brand-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">ทะเบียนรถ & สภาพรถ (Vehicles)</h3>
          <p className="text-xs text-content-muted mt-1">ทะเบียนรถ ยี่ห้อ รุ่น เลขไมล์ และวันหมดอายุประกัน/พ.ร.บ.</p>
        </Link>

        <Link
          href="/admin/enterprise/fleet/dispatch"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Navigation className="w-6 h-6 text-indigo-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">จัดคิวเดินรถ & มอบหมาย (Dispatch)</h3>
          <p className="text-xs text-content-muted mt-1">จัดตารางการใช้รถ มอบหมายคนขับ และติดตามสถานะเรียลไทม์</p>
        </Link>

        <Link
          href="/admin/enterprise/fleet/fuel"
          className="bg-surface-card hover:bg-surface-subtle border border-surface-border rounded-3xl p-5 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <Fuel className="w-6 h-6 text-amber-600" />
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="font-bold text-sm text-content-primary">บันทึกน้ำมัน & อัตราสิ้นเปลือง (Fuel)</h3>
          <p className="text-xs text-content-muted mt-1">บันทึกใบเสร็จน้ำมัน คำนวณกิโลเมตรต่อลิตรรายคัน</p>
        </Link>
      </div>

      {/* Recent Trips */}
      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">การเดินทางล่าสุด (Recent Trips)</h2>
          <Link href="/admin/enterprise/fleet/trips" className="text-xs font-bold text-brand-600 hover:underline">
            ดูทริปทั้งหมด
          </Link>
        </div>

        {trips.length === 0 ? (
          <div className="p-8 text-center text-content-muted text-xs">ยังไม่มีบันทึกการเดินทางในระบบ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ทริป</th>
                  <th className="p-3">ทะเบียนรถ</th>
                  <th className="p-3">คนขับ</th>
                  <th className="p-3">วัตถุประสงค์</th>
                  <th className="p-3">ต้นทาง → ปลายทาง</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{t.refNo || t.id.slice(0, 8)}</td>
                    <td className="p-3 font-bold text-content-primary">{t.vehicle?.plateNo}</td>
                    <td className="p-3 text-content-secondary">
                      {t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : "ไม่ระบุ"}
                    </td>
                    <td className="p-3 text-content-primary">{t.purpose}</td>
                    <td className="p-3 text-content-muted">
                      {t.origin || "-"} → {t.destination || "-"}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600">
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
