import { prisma } from "@/lib/prisma";
import { Fuel, Calendar, DollarSign, Truck } from "lucide-react";
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

export default async function FleetFuelPage() {
  const fuelRecords = await prisma.fuelRecord.findMany({
    include: {
      vehicle: { select: { plateNo: true, brand: true } },
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  const totalCost = fuelRecords.reduce((acc, f) => acc + Number(f.totalCost || 0), 0);
  const totalLiters = fuelRecords.reduce((acc, f) => acc + Number(f.liters || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="FLEET / FUEL MANAGEMENT"
        title="บันทึกการเติมน้ำมันเชื้อเพลิง (Fuel Records)"
        description="ตรวจสอบประวัติการเติมน้ำมัน จำนวนลิตร ยอดเงิน และสถานีบริการน้ำมัน"
        breadcrumbs={[
          { label: "ฟลีทและขนส่ง", href: "/admin/enterprise/fleet" },
          { label: "บันทึกน้ำมัน" },
        ]}
      />

      <EnterpriseModuleNav tabs={FLEET_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-content-primary">ประวัติการเติมน้ำมัน ({fuelRecords.length} ครั้ง)</h2>
            <div className="flex items-center space-x-4 text-xs font-bold mt-1">
              <span className="text-amber-600">ยอดเงินรวม: ฿{totalCost.toLocaleString()}</span>
              <span className="text-content-muted">ปริมาณรวม: {totalLiters.toFixed(1)} ลิตร</span>
            </div>
          </div>
          <span className="text-xs text-content-muted">MySQL Records</span>
        </div>

        {fuelRecords.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Fuel className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีบันทึกการเติมน้ำมัน</p>
            <p className="text-xs">สามารถบันทึกใบเสร็จการเติมน้ำมันของยานพาหนะแต่ละคันได้</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">วันที่</th>
                  <th className="p-3">ทะเบียนรถ</th>
                  <th className="p-3">ปริมาณ (ลิตร)</th>
                  <th className="p-3">ราคา / ลิตร</th>
                  <th className="p-3">ยอดเงินรวม</th>
                  <th className="p-3">เลขไมล์</th>
                  <th className="p-3 rounded-r-xl">สถานีบริการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {fuelRecords.map((f) => (
                  <tr key={f.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-semibold">{new Date(f.date).toLocaleDateString("th-TH")}</td>
                    <td className="p-3 font-bold text-content-primary">{f.vehicle?.plateNo}</td>
                    <td className="p-3 font-medium text-content-secondary">{f.liters} ลิตร</td>
                    <td className="p-3 text-content-muted">฿{Number(f.pricePerLiter || 0).toFixed(2)}</td>
                    <td className="p-3 font-bold text-amber-600">฿{Number(f.totalCost || 0).toLocaleString()}</td>
                    <td className="p-3 font-mono text-content-secondary">{f.odometer?.toLocaleString() || "-"}</td>
                    <td className="p-3 text-content-muted">{f.station || "-"}</td>
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
