import { prisma } from "../../lib/prisma";

export interface ConflictWarning {
  severity: "WARNING" | "BLOCK";
  code: string;
  message: string;
  conflictingRoles?: string[];
  conflictingPermissions?: string[];
}

export class RoleConflictService {
  /**
   * Static rule definitions for Separation of Duties (SoD)
   */
  private static readonly SOD_RULES = [
    {
      code: "SOD_PAYMENT",
      permA: "finance.payment.create",
      permB: "finance.payment.approve",
      severity: "BLOCK" as const,
      message: "ห้ามมิให้ผู้สร้างรายการเตรียมจ่ายเงิน (Payment Creator) มีสิทธิ์อนุมัติจ่ายเงินขั้นสุดท้าย (Payment Approver)",
    },
    {
      code: "SOD_PAYROLL",
      permA: "payroll.prepare",
      permB: "payroll.approve",
      severity: "BLOCK" as const,
      message: "ห้ามมิให้ผู้จัดทำและประมวลผลเงินเดือน (Payroll Preparer) มีสิทธิ์อนุมัติการจ่ายเงินเดือนรอบงวด (Payroll Final Approver)",
    },
    {
      code: "SOD_PO",
      permA: "procurement.pr.create",
      permB: "procurement.po.approve",
      severity: "WARNING" as const,
      message: "คำเตือน: ผู้ขอซื้อสินค้า (PR Requester) ไม่ควรเป็นผู้อนุมัติใบสั่งซื้อ (PO Approver) ในรายการเดียวกัน",
    },
    {
      code: "SOD_SECURITY_AUDIT",
      permA: "security.role.manage",
      permB: "employee.salary.read",
      severity: "WARNING" as const,
      message: "คำเตือนความปลอดภัย: ผู้ดูแล Security ไม่ควรมีสิทธิ์เข้าถึงข้อมูลเงินเดือนพนักงานโดยไม่จำเป็น",
    },
    {
      code: "SOD_PLATFORM_DATA",
      permA: "platform.backup.manage",
      permB: "employee.read",
      severity: "WARNING" as const,
      message: "คำเตือนความปลอดภัย: ผู้ดูแลโครงสร้างพื้นฐาน (Platform Admin) ไม่ควรเข้าถึงข้อมูลพนักงานระดับบุคคล",
    },
  ];

  /**
   * Validate if adding a role to a user will cause any Separation of Duties conflicts
   */
  static async checkRoleAssignmentConflicts(
    userId: string,
    newRoleId: string
  ): Promise<ConflictWarning[]> {
    const warnings: ConflictWarning[] = [];

    // 1. Get new role permissions
    const newRole = await prisma.role.findUnique({
      where: { id: newRoleId },
      include: { permissions: { include: { permission: true } } },
    });

    if (!newRole) return warnings;

    const newPermCodes = new Set(
      newRole.permissions.map((rp) => rp.permission.code)
    );

    // 2. Get existing user's active permissions
    const activeAssignments = await prisma.userRoleAssignment.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    const existingPermsMap = new Map<string, string>(); // permCode -> roleCode
    for (const a of activeAssignments) {
      for (const rp of a.role.permissions) {
        existingPermsMap.set(rp.permission.code, a.role.code);
      }
    }

    // 3. Test each SoD rule
    for (const rule of this.SOD_RULES) {
      const hasPermAExisting = existingPermsMap.has(rule.permA);
      const hasPermBExisting = existingPermsMap.has(rule.permB);
      const hasPermANew = newPermCodes.has(rule.permA);
      const hasPermBNew = newPermCodes.has(rule.permB);

      const willHaveA = hasPermAExisting || hasPermANew;
      const willHaveB = hasPermBExisting || hasPermBNew;

      if (willHaveA && willHaveB) {
        warnings.push({
          severity: rule.severity,
          code: rule.code,
          message: rule.message,
          conflictingPermissions: [rule.permA, rule.permB],
          conflictingRoles: [
            existingPermsMap.get(rule.permA) || newRole.code,
            existingPermsMap.get(rule.permB) || newRole.code,
          ],
        });
      }
    }

    return warnings;
  }

  /**
   * Enforce runtime Separation of Duties: Creator cannot be the Final Approver
   */
  static validateSeparationOfDuties(opts: {
    creatorId: string;
    approverId: string;
    actionName: string;
  }): { valid: boolean; error?: string } {
    if (opts.creatorId === opts.approverId) {
      return {
        valid: false,
        error: `ละเมิดหลักการแบ่งแยกหน้าที่ (Separation of Duties): ผู้สร้างรายการ (${opts.actionName}) ไม่สามารถเป็นผู้อนุมัติขั้นสุดท้ายในรายการของตนเองได้`,
      };
    }
    return { valid: true };
  }
}
