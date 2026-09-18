import { prisma } from "@/lib/prisma";
import { Truck, Calendar, ShieldCheck, Gauge } from "lucide-react";
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

export default async function FleetVehiclesPage() {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      _count: { select: { trips: true, maintenances: true, fuelRecords: true } },
    },
    orderBy: { code: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FLEET / VEHICLES"
        title="ทะเบียนยานพาหนะ (Vehicle Registry)"
        description="รายการรถยนต์ รถกระบะ และรถบรรทุกทั้งหมดในสังกัด พร้อมเลขไมล์และสถานะความพร้อมใช้งาน"
        breadcrumbs={[
          { label: "ฟลีทและขนส่ง", href: "/admin/enterprise/fleet" },
          { label: "ยานพาหนะ" },
        ]}
      />

      <EnterpriseModuleNav tabs={FLEET_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายชื่อยานพาหนะทั้งหมด ({vehicles.length} คัน)</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {vehicles.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Truck className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อมูลยานพาหนะ</p>
            <p className="text-xs">สามารถเพิ่มทะเบียนรถและข้อมูลยี่ห้อ/รุ่นได้ทันที</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div key={v.id} className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-md">
                      {v.code}
                    </span>
                    <h3 className="text-base font-black text-content-primary mt-1">{v.plateNo}</h3>
                    <p className="text-xs text-content-muted">{v.brand} {v.model} ({v.type})</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    v.status === "AVAILABLE"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : v.status === "ON_TRIP"
                      ? "bg-indigo-500/10 text-indigo-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}>
                    {v.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-content-secondary border-t border-surface-border/50 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-content-muted flex items-center">
                      <Gauge className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      เลขไมล์:
                    </span>
                    <span className="font-bold">{v.odometer.toLocaleString()} กม.</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-content-muted">เชื้อเพลิง:</span>
                    <span className="font-bold">{v.fuelType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-content-muted">พ.ร.บ. / ประกัน:</span>
                    <span className="text-[11px]">
                      {v.insuranceExp ? new Date(v.insuranceExp).toLocaleDateString("th-TH") : "ไม่ระบุ"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-content-muted border-t border-surface-border/50 pt-2">
                  <span>ทริป: {v._count.trips}</span>
                  <span>ซ่อม: {v._count.maintenances}</span>
                  <span>เติมน้ำมัน: {v._count.fuelRecords}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
