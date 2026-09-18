import { Cpu, Zap, ToggleRight, CheckCircle2 } from "lucide-react";
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

const RULES = [
  { id: "R-01", name: "Auto-Approve Check-in within Geofence", trigger: "Attendance Created", condition: "distance <= radius && photoVerified", action: "Set isApproved = true" },
  { id: "R-02", name: "Flag Outside Geofence Alert", trigger: "Attendance Created", condition: "distance > radius", action: "Create SystemAlert(SEVERITY=HIGH)" },
  { id: "R-03", name: "OT Calculation Rule", trigger: "Checkout Recorded", condition: "checkoutTime >= otStart", action: "Calculate OT hours via PayrollConfig" },
  { id: "R-04", name: "PO 3-Way Match Verification", trigger: "Goods Receipt Created", condition: "receiptQty == poQty && amount == invoiceAmount", action: "Mark poMatched = true" },
  { id: "R-05", name: "Vehicle Maintenance Alert", trigger: "Trip Completed", condition: "currentOdometer >= nextMaintenanceOdometer", action: "Trigger Fleet Maintenance Notification" },
];

export default function AutomationRulesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="AUTOMATION / BUSINESS RULES"
        title="กฎเกณฑ์และเงื่อนไขอัตโนมัติ (Business Rules Engine)"
        description="การกำหนดเงื่อนไขทางธุรกิจ (Trigger - Condition - Action) เพื่อลดภาระงานแอดมินและป้องกันข้อผิดพลาด"
        breadcrumbs={[
          { label: "ระบบอัตโนมัติ", href: "/admin/automation" },
          { label: "กฎเกณฑ์อัตโนมัติ (Rules)" },
        ]}
      />

      <EnterpriseModuleNav tabs={AUTOMATION_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">กฎเกณฑ์ที่เปิดใช้งาน (Active Business Rules)</h2>
          <span className="text-xs text-content-muted">Rule Engine v2.0</span>
        </div>

        <div className="space-y-3">
          {RULES.map((r) => (
            <div key={r.id} className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-md">
                  {r.id}
                </span>
                <span className="flex items-center text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  เปิดใช้งาน
                </span>
              </div>
              <h3 className="text-sm font-bold text-content-primary">{r.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2.5 bg-surface-card rounded-xl border border-surface-border">
                  <span className="text-content-muted font-bold block text-[10px]">EVENT TRIGGER</span>
                  <span className="font-semibold text-indigo-600">{r.trigger}</span>
                </div>
                <div className="p-2.5 bg-surface-card rounded-xl border border-surface-border">
                  <span className="text-content-muted font-bold block text-[10px]">CONDITION</span>
                  <span className="font-mono text-content-secondary">{r.condition}</span>
                </div>
                <div className="p-2.5 bg-surface-card rounded-xl border border-surface-border">
                  <span className="text-content-muted font-bold block text-[10px]">ACTION</span>
                  <span className="font-semibold text-emerald-600">{r.action}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
