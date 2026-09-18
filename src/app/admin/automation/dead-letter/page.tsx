import { prisma } from "@/lib/prisma";
import { AlertCircle, RefreshCw, Calendar } from "lucide-react";
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

export default async function AutomationDeadLetterPage() {
  const deadLetters = await prisma.eventOutbox.findMany({
    where: { status: "FAILED" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="AUTOMATION / DEAD-LETTER QUEUE (DLQ)"
        title="คิวงานที่ล้มเหลว (Dead-Letter Queue - DLQ)"
        description="ตรวจสอบข้อความและเหตุการณ์ที่ไม่สามารถประมวลผลสำเร็จหลังจาก Retry ครบจำนวนครั้งที่กำหนด"
        breadcrumbs={[
          { label: "ระบบอัตโนมัติ", href: "/admin/automation" },
          { label: "Dead-Letter Queue" },
        ]}
      />

      <EnterpriseModuleNav tabs={AUTOMATION_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">รายการข้อผิดพลาดใน DLQ ({deadLetters.length})</h2>
          <span className="text-xs text-content-muted">MySQL Error Records</span>
        </div>

        {deadLetters.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <AlertCircle className="w-12 h-12 mx-auto text-emerald-500" />
            <p className="font-bold text-sm text-emerald-600">ไม่มีงานที่ล้มเหลวใน Dead-Letter Queue</p>
            <p className="text-xs">ทุกงานและเหตุการณ์ในระบบประมวลผลได้สำเร็จ 100%</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">Event ID</th>
                  <th className="p-3">ประเภทเหตุการณ์</th>
                  <th className="p-3">เวลาที่เกิดข้อผิดพลาด</th>
                  <th className="p-3">ข้อความข้อผิดพลาด (Last Error)</th>
                  <th className="p-3 rounded-r-xl">จำนวนพยายาม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {deadLetters.map((dl) => (
                  <tr key={dl.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-600">{dl.eventId.slice(0, 12)}...</td>
                    <td className="p-3 font-bold text-content-primary">{dl.eventType}</td>
                    <td className="p-3 text-content-muted">{new Date(dl.createdAt).toLocaleString("th-TH")}</td>
                    <td className="p-3 text-rose-600 font-mono max-w-sm truncate">{dl.lastError || "Unknown error"}</td>
                    <td className="p-3 font-bold text-content-primary">{dl.attempts} ครั้ง</td>
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
