import { prisma } from "@/lib/prisma";
import { Zap, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const AUTOMATION_TABS = [
  { label: "ภาพรวมระบบอัตโนมัติ", href: "/admin/automation" },
  { label: "กระบวนการอนุมัติ (Workflows)", href: "/admin/automation/workflows" },
  { label: "กฎเกณฑ์อัตโนมัติ (Rules)", href: "/admin/automation/rules" },
  { label: "บันทึกเหตุการณ์ (Events)", href: "/admin/automation/events" },
  { label: "คิวประมวลผล (Queues)", href: "/admin/automation/queues" },
  { label: "Dead-Letter Queue", href: "/admin/automation/dead-letter" },
];

export default async function AutomationEventsPage() {
  const events = await prisma.eventOutbox.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="AUTOMATION / EVENT OUTBOX BUS"
        title="บันทึกเหตุการณ์และข้อความ (Event Outbox Bus)"
        description="รายการเหตุการณ์ที่เกิดขึ้นในระบบตาม Transactional Outbox Pattern เพื่อการประมวลผลแบบอะซิงโครนัส"
        breadcrumbs={[
          { label: "ระบบอัตโนมัติ", href: "/admin/automation" },
          { label: "บันทึกเหตุการณ์ (Events)" },
        ]}
      />

      <EnterpriseModuleNav tabs={AUTOMATION_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">ประวัติเหตุการณ์ ({events.length} รายการ)</h2>
          <span className="text-xs text-content-muted">MySQL EventOutbox</span>
        </div>

        {events.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Zap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีบันทึกเหตุการณ์ในระบบ</p>
            <p className="text-xs">เมื่อมีการดำเนินการสำคัญ เช่น ลงเวลา อนุมัติ หรือเบิกจ่าย ข้อมูลจะถูกส่งเข้า Outbox</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Event ID</th>
                  <th className="p-3">ประเภทเหตุการณ์</th>
                  <th className="p-3">เวอร์ชัน</th>
                  <th className="p-3">เวลาที่สร้าง</th>
                  <th className="p-3">จำนวนครั้งที่พยายาม</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{ev.eventId.slice(0, 12)}...</td>
                    <td className="p-3 font-bold text-content-primary">{ev.eventType}</td>
                    <td className="p-3 font-mono text-content-muted">v{ev.version}</td>
                    <td className="p-3 text-content-secondary">{new Date(ev.createdAt).toLocaleString("th-TH")}</td>
                    <td className="p-3 font-semibold text-content-primary">{ev.attempts} ครั้ง</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.status === "PROCESSED"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : ev.status === "FAILED"
                          ? "bg-rose-500/10 text-rose-600"
                          : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {ev.status}
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
