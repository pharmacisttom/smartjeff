import { prisma } from "@/lib/prisma";

export class LeaveService {
  static async getAll(options?: { employeeId?: string | null; status?: string | null }) {
    const where: any = {};
    if (options?.employeeId) where.employeeId = options.employeeId;
    if (options?.status && options.status !== "ALL") where.status = options.status;

    return prisma.leave.findMany({
      where,
      include: {
        employee: {
          include: { site: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async create(data: {
    employeeId: string;
    type: any;
    startDate: string;
    endDate: string;
    reason?: string | null;
  }) {
    return prisma.leave.create({
      data: {
        employeeId: data.employeeId,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason || null,
        status: "PENDING",
      },
      include: { employee: true },
    });
  }

  static async updateStatus(id: string, status: "APPROVED" | "REJECTED", approvedBy?: string) {
    return prisma.leave.update({
      where: { id },
      data: {
        status,
        approvedBy: approvedBy || "HR Admin",
        approvedAt: new Date(),
      },
      include: { employee: true },
    });
  }
}
