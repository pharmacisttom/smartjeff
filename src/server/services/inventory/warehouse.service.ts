import { prisma } from "@/lib/prisma";

export class WarehouseService {
  static async getWarehouses() {
    return prisma.warehouse.findMany({
      include: {
        site: true,
        balances: {
          include: { item: true },
        },
        _count: {
          select: {
            balances: true,
            movements: true,
            issues: true,
            receipts: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  static async getWarehouseById(id: string) {
    return prisma.warehouse.findUnique({
      where: { id },
      include: {
        site: true,
        balances: {
          include: {
            item: {
              include: { unit: true, category: true },
            },
          },
        },
      },
    });
  }

  static async createWarehouse(data: {
    code: string;
    name: string;
    type?: string;
    siteId?: string;
    location?: string;
    status?: string;
    managerId?: string;
  }) {
    return prisma.warehouse.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type || "CENTRAL",
        siteId: data.siteId,
        location: data.location,
        status: data.status || "ACTIVE",
        managerId: data.managerId,
      },
      include: { site: true },
    });
  }

  static async updateWarehouse(
    id: string,
    data: {
      name?: string;
      type?: string;
      siteId?: string;
      location?: string;
      status?: string;
      managerId?: string;
    }
  ) {
    return prisma.warehouse.update({
      where: { id },
      data,
      include: { site: true },
    });
  }

  static async getWarehouseStock(warehouseId: string) {
    return prisma.stockBalance.findMany({
      where: { warehouseId },
      include: {
        item: {
          include: { unit: true, category: true },
        },
      },
      orderBy: { item: { code: "asc" } },
    });
  }
}
