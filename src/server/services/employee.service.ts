import { prisma } from "@/lib/prisma";

export class EmployeeService {
  static async getAll(options?: { siteId?: string | null; search?: string | null }) {
    const where: any = {};
    if (options?.siteId) where.siteId = options.siteId;
    if (options?.search) {
      where.OR = [
        { code: { contains: options.search } },
        { firstName: { contains: options.search } },
        { lastName: { contains: options.search } },
        { position: { contains: options.search } },
      ];
    }

    return prisma.employee.findMany({
      where,
      include: { site: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: {
        site: true,
        attendances: { take: 10, orderBy: { timestamp: "desc" } },
        leaves: { take: 10, orderBy: { createdAt: "desc" } },
        payslips: { take: 12, orderBy: { period: "desc" } },
      },
    });
  }

  static async create(data: {
    code: string;
    prefix?: string | null;
    firstName: string;
    lastName: string;
    position: string;
    siteId: string;
    gender?: any;
    nationality?: string | null;
    idCardNo?: string | null;
    phone?: string | null;
    birthDate?: Date | string | null;
    startDate?: Date | string | null;
    bankAccount?: string | null;
    bankName?: string | null;
    hospital?: string | null;
    insurance?: string | null;
    education?: string | null;
    hometown?: string | null;
    salaryType?: any;
    baseSalary?: number;
    dailyRate?: number;
  }) {
    return prisma.employee.create({
      data: {
        code: data.code,
        prefix: data.prefix || null,
        firstName: data.firstName,
        lastName: data.lastName,
        position: data.position,
        siteId: data.siteId,
        gender: data.gender || "MALE",
        nationality: data.nationality || "ไทย",
        idCardNo: data.idCardNo || null,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        bankAccount: data.bankAccount || null,
        bankName: data.bankName || null,
        hospital: data.hospital || null,
        insurance: data.insurance || null,
        education: data.education || null,
        hometown: data.hometown || null,
        salaryType: data.salaryType || "MONTHLY",
        baseSalary: data.baseSalary !== undefined ? data.baseSalary : 12000,
        dailyRate: data.dailyRate !== undefined ? data.dailyRate : 400,
      },
      include: { site: true },
    });
  }

  static async update(id: string, data: any) {
    return prisma.employee.update({
      where: { id },
      data: {
        code: data.code,
        prefix: data.prefix,
        firstName: data.firstName,
        lastName: data.lastName,
        position: data.position,
        siteId: data.siteId,
        gender: data.gender,
        nationality: data.nationality,
        idCardNo: data.idCardNo,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        bankAccount: data.bankAccount,
        bankName: data.bankName,
        hospital: data.hospital,
        insurance: data.insurance,
        education: data.education,
        hometown: data.hometown,
        salaryType: data.salaryType,
        baseSalary: data.baseSalary !== undefined ? parseFloat(data.baseSalary) : undefined,
        dailyRate: data.dailyRate !== undefined ? parseFloat(data.dailyRate) : undefined,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : undefined,
      },
      include: { site: true },
    });
  }

  static async delete(id: string) {
    return prisma.employee.delete({ where: { id } });
  }
}
