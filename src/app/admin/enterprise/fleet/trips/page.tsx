import { prisma } from "@/lib/prisma";
import { Navigation, Calendar, Truck, Users, MapPin } from "lucide-react";
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

export default async function FleetTripsPage() {
  const trips = await prisma.trip.findMany({
    include: {
      vehicle: { select: { plateNo: true, brand: true } },
      driver: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FLEET / TRIPS LOG"
        title="บันทึกการเดินทาง (Trips Log)"
        description="ประวัติการเดินทางของยานพาหนะ ระยะทาง เลขไมล์เริ่มต้น-สิ้นสุด และวัตถุประสงค์งาน"
        breadcrumbs={[
          { label: "ฟลีทและขนส่ง", href: "/admin/enterprise/fleet" },
          { label: "การเดินทาง (Trips)" },
        ]}
      />

      <EnterpriseModuleNav tabs={FLEET_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ประวัติการเดินทางทั้งหมด ({trips.length} รายการ)</h2>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {trips.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Navigation className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีบันทึกการเดินทาง</p>
            <p className="text-xs">สามารถบันทึกทริปการเดินทางใหม่และมอบหมายรถได้ที่หน้าจัดคิวเดินรถ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">เลขที่ทริป</th>
                  <th className="p-3">ยานพาหนะ</th>
                  <th className="p-3">คนขับ</th>
                  <th className="p-3">วัตถุประสงค์</th>
                  <th className="p-3">เส้นทาง</th>
                  <th className="p-3">เลขไมล์เริ่ม - สิ้นสุด</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600 dark:text-brand-400">
                      {t.refNo || t.id.slice(0, 8)}
                    </td>
                    <td className="p-3 font-bold text-content-primary">
                      {t.vehicle?.plateNo}
                      <span className="block text-[10px] text-content-muted">{t.vehicle?.brand}</span>
                    </td>
                    <td className="p-3 text-content-secondary">
                      {t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : "ไม่ระบุ"}
                    </td>
                    <td className="p-3 font-medium text-content-primary">{t.purpose}</td>
                    <td className="p-3 text-content-muted">
                      {t.origin || "ต้นทาง"} → {t.destination || "ปลายทาง"}
                    </td>
                    <td className="p-3 font-mono text-content-secondary">
                      {t.odometerStart?.toLocaleString() || "-"} - {t.odometerEnd?.toLocaleString() || "-"} กม.
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : t.status === "IN_PROGRESS"
                          ? "bg-indigo-500/10 text-indigo-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
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
