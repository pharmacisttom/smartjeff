import { prisma } from "@/lib/prisma";
import { Laptop, Smartphone, Shield, Calendar, MapPin } from "lucide-react";
import { EnterpriseModuleHeader } from "@/components/enterprise/EnterpriseModuleHeader";
import { EnterpriseModuleNav } from "@/components/enterprise/EnterpriseModuleNav";

export const revalidate = 0;

const SECURITY_TABS = [
  { label: "ศูนย์ความปลอดภัย", href: "/admin/security" },
  { label: "ผู้ใช้งาน (Users)", href: "/admin/security/users" },
  { label: "บทบาทและสิทธิ์ (Roles)", href: "/admin/security/roles" },
  { label: "รายการสิทธิ์ (Permissions)", href: "/admin/security/permissions" },
  { label: "ตารางสิทธิ์ (Matrix)", href: "/admin/security/permission-matrix" },
  { label: "สิทธิ์ระดับแผนก", href: "/admin/security/department-access" },
  { label: "อำนาจอนุมัติ (Approval Matrix)", href: "/admin/security/approval-matrix" },
  { label: "จัดการ Session", href: "/admin/security/sessions" },
  { label: "อุปกรณ์ที่เข้าสู่ระบบ", href: "/admin/security/devices" },
  { label: "คำขอเข้าถึงข้อมูล", href: "/admin/security/access-requests" },
  { label: "ทบทวนสิทธิ์ (Access Review)", href: "/admin/security/access-review" },
  { label: "บันทึกการตรวจสอบ (Audit Log)", href: "/admin/security/audit" },
];

export default async function SecurityDevicesPage() {
  const sessions = await prisma.userSession.findMany({
    include: {
      user: { select: { email: true, displayName: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="SECURITY / DEVICE TRUST & SESSIONS"
        title="อุปกรณ์ที่เข้าสู่ระบบและความน่าเชื่อถือ (Device Trust Registry)"
        description="ตรวจสอบอุปกรณ์ คอมพิวเตอร์ และสมาร์ทโฟนที่เข้าสู่ระบบ พร้อม IP Address และประเภทเบราว์เซอร์"
        breadcrumbs={[
          { label: "ศูนย์ความปลอดภัย", href: "/admin/security" },
          { label: "อุปกรณ์ที่เข้าสู่ระบบ" },
        ]}
      />

      <EnterpriseModuleNav tabs={SECURITY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">อุปกรณ์ที่มีการใช้งาน ({sessions.length})</h2>
          <span className="text-xs text-content-muted">Active & Recent Device Tokens</span>
        </div>

        {sessions.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Laptop className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีข้อมูลอุปกรณ์ในระบบ</p>
            <p className="text-xs">เมื่อมีผู้ใช้งานล็อกอินเข้าสู่ระบบ อุปกรณ์จะถูกบันทึกที่นี่</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-content-muted uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3 rounded-l-xl">ผู้ใช้งาน</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">ข้อมูลอุปกรณ์ / เบราว์เซอร์ (User-Agent)</th>
                  <th className="p-3">เวลาล็อกอินล่าสุด</th>
                  <th className="p-3 rounded-r-xl">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="p-3 font-bold text-content-primary">
                      {s.user.displayName || s.user.email}
                      <span className="block text-[10px] text-content-muted">{s.user.role}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-indigo-600">{s.ipAddress || "127.0.0.1"}</td>
                    <td className="p-3 text-content-secondary max-w-sm truncate text-[11px]">
                      {s.userAgent || "Desktop Browser"}
                    </td>
                    <td className="p-3 text-content-muted">{new Date(s.createdAt).toLocaleString("th-TH")}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                      }`}>
                        {s.status}
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
