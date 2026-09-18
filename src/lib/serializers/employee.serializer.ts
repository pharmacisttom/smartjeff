import type { UserAuthzContext } from "@/server/services/authorization.service";

export interface RawEmployee {
  id: string;
  code: string;
  prefix?: string | null;
  firstName: string;
  lastName: string;
  position: string;
  siteId: string;
  site?: { id?: string; code?: string; name: string } | null;
  phone?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  salaryType?: string | null;
  baseSalary?: number | any;
  dailyRate?: number | any;
  isActive?: boolean;
  user?: { id?: string; email?: string } | null;
  [key: string]: any;
}

export class EmployeeSerializer {
  /**
   * Mask a phone number to format: 08x-xxx-xxxx
   */
  static maskPhone(phone: string | null | undefined): string | null {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, "");
    if (clean.length < 8) return "08x-xxx-xxxx";
    const prefix = clean.substring(0, 2);
    const suffix = clean.substring(clean.length - 4);
    return `${prefix}x-xxx-${suffix}`;
  }

  /**
   * Mask a bank account to format: xxx-x-xxxxx-x
   */
  static maskBank(bankAccount: string | null | undefined): string | null {
    if (!bankAccount) return null;
    const clean = bankAccount.replace(/\D/g, "");
    if (clean.length < 4) return "xxx-x-xxxxx-x";
    const suffix = clean.substring(clean.length - 3);
    return `xxx-x-xxx${suffix}`;
  }

  /**
   * Mask Employee Code: EMP******
   */
  static maskCode(code: string): string {
    if (!code) return "EMP******";
    return "EMP******";
  }

  /**
   * Transform an employee record by evaluating viewer permissions and masking sensitive fields
   */
  static serialize(
    employee: RawEmployee,
    viewerContext?: UserAuthzContext | null,
    viewerEmployeeId?: string | null
  ): Record<string, any> {
    const isSelf = Boolean(viewerEmployeeId && viewerEmployeeId === employee.id);
    const isSuperAdmin = Boolean(viewerContext?.isSuperAdmin);

    const hasCodePerm = isSelf || isSuperAdmin || Boolean(viewerContext?.permissions.has("employee.code.read"));
    const hasPhonePerm = isSelf || isSuperAdmin || Boolean(viewerContext?.permissions.has("employee.phone.read"));
    const hasBankPerm = isSelf || isSuperAdmin || Boolean(viewerContext?.permissions.has("employee.bank.read"));
    const hasSalaryPerm = isSelf || isSuperAdmin || Boolean(viewerContext?.permissions.has("employee.salary.read"));

    return {
      id: employee.id,
      code: hasCodePerm ? employee.code : this.maskCode(employee.code),
      isCodeMasked: !hasCodePerm,
      prefix: employee.prefix || null,
      firstName: employee.firstName,
      lastName: employee.lastName,
      fullName: `${employee.prefix ? `${employee.prefix} ` : ""}${employee.firstName} ${employee.lastName}`,
      position: employee.position,
      siteId: employee.siteId,
      site: employee.site || null,
      phone: hasPhonePerm ? employee.phone : this.maskPhone(employee.phone),
      isPhoneMasked: !hasPhonePerm,
      bankName: employee.bankName || null,
      bankAccount: hasBankPerm ? employee.bankAccount : this.maskBank(employee.bankAccount),
      isBankMasked: !hasBankPerm,
      salaryType: employee.salaryType || "MONTHLY",
      baseSalary: hasSalaryPerm ? Number(employee.baseSalary || 0) : null,
      dailyRate: hasSalaryPerm ? Number(employee.dailyRate || 0) : null,
      isSalaryMasked: !hasSalaryPerm,
      salaryMaskedDisplay: hasSalaryPerm ? undefined : "••••••",
      isActive: employee.isActive ?? true,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  /**
   * Serialize an array of employee records
   */
  static serializeMany(
    employees: RawEmployee[],
    viewerContext?: UserAuthzContext | null,
    viewerEmployeeId?: string | null
  ): Record<string, any>[] {
    return employees.map((emp) => this.serialize(emp, viewerContext, viewerEmployeeId));
  }
}
