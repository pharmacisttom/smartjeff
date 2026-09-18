import { prisma } from "@/lib/prisma";
import { Building2, Shield, Users, CheckCircle2 } from "lucide-react";
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

export default async function SecurityDepartmentAccessPage() {
  const departments = await prisma.department.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      <EnterpriseModuleHeader
        badge="SECURITY / DATA SCOPING"
        title="สิทธิ์การเข้าถึงข้อมูลระดับแผนก (Department Access Scoping)"
        description="การจำกัดขอบเขตการมองเห็นข้อมูล (Data Isolation) ตามโครงสร้างองค์กร แผนก และศูนย์ต้นทุน"
        breadcrumbs={[
          { label: "ศูนย์ความปลอดภัย", href: "/admin/security" },
          { label: "สิทธิ์ระดับแผนก" },
        ]}
      />

      <EnterpriseModuleNav tabs={SECURITY_TABS} />

      <div className="bg-surface-card border border-surface-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-surface-border pb-3">
          <h2 className="text-sm font-bold text-content-primary">โครงสร้างแผนกและขอบเขตสิทธิ์ ({departments.length})</h2>
          <span className="text-xs text-content-muted">MySQL Department Scopes</span>
        </div>

        {departments.length === 0 ? (
          <div className="p-12 text-center text-content-muted space-y-2">
            <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
            <p className="font-bold text-sm">ยังไม่มีโครงสร้างแผนกในระบบ</p>
            <p className="text-xs">สามารถสร้างแผนกเพื่อกำหนดขอบเขตข้อมูลรายฝ่ายได้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="p-5 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded-md">
                      {dept.code}
                    </span>
                    <h3 className="font-bold text-sm text-content-primary mt-1">{dept.name}</h3>
                    {dept.nameTh && <p className="text-xs text-content-muted">{dept.nameTh}</p>}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                    {dept.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-indigo-600 font-bold pt-2 border-t border-surface-border/50">
                  <span>Scope Level</span>
                  <span>DEPARTMENT_ISOLATION</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
