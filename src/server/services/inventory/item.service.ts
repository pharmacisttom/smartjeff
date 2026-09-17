import { prisma } from "@/lib/prisma";

export interface ItemFilter {
  categoryId?: string;
  itemType?: string;
  search?: string;
  isActive?: boolean;
}

export class ItemService {
  static async getItems(filter?: ItemFilter) {
    const where: any = {};
    if (filter?.categoryId) where.categoryId = filter.categoryId;
    if (filter?.itemType) where.itemType = filter.itemType;
    if (filter?.isActive !== undefined) where.isActive = filter.isActive;
    if (filter?.search) {
      where.OR = [
        { code: { contains: filter.search } },
        { name: { contains: filter.search } },
        { sku: { contains: filter.search } },
        { barcode: { contains: filter.search } },
      ];
    }

    return prisma.item.findMany({
      where,
      include: {
        category: true,
        unit: true,
        balances: {
          include: { warehouse: true },
        },
      },
      orderBy: { code: "asc" },
    });
  }

  static async getItemById(id: string) {
    return prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        unit: true,
        balances: {
          include: { warehouse: true },
        },
        assets: true,
      },
    });
  }

  static async createItem(data: {
    code: string;
    name: string;
    description?: string;
    categoryId: string;
    unitId: string;
    itemType?: string;
    sku?: string;
    barcode?: string;
    minimumStock?: number;
    maximumStock?: number;
    reorderPoint?: number;
    standardCost?: number;
  }) {
    return prisma.item.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        categoryId: data.categoryId,
        unitId: data.unitId,
        itemType: data.itemType || "MATERIAL",
        sku: data.sku,
        barcode: data.barcode,
        minimumStock: data.minimumStock ?? 0,
        maximumStock: data.maximumStock,
        reorderPoint: data.reorderPoint ?? 0,
        standardCost: data.standardCost ?? 0,
      },
      include: { category: true, unit: true },
    });
  }

  static async updateItem(
    id: string,
    data: {
      name?: string;
      description?: string;
      categoryId?: string;
      unitId?: string;
      itemType?: string;
      sku?: string;
      barcode?: string;
      minimumStock?: number;
      maximumStock?: number;
      reorderPoint?: number;
      standardCost?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.item.update({
      where: { id },
      data,
      include: { category: true, unit: true },
    });
  }

  static async getCategories() {
    return prisma.itemCategory.findMany({
      include: {
        parent: true,
        children: true,
        _count: { select: { items: true } },
      },
      orderBy: { code: "asc" },
    });
  }

  static async createCategory(data: { code: string; name: string; parentId?: string }) {
    return prisma.itemCategory.create({
      data,
    });
  }

  static async getUnits() {
    return prisma.unitOfMeasure.findMany({
      orderBy: { code: "asc" },
    });
  }

  static async createUnit(data: { code: string; nameTh: string; nameEn: string }) {
    return prisma.unitOfMeasure.create({
      data,
    });
  }

  static async getLowStockItems() {
    const items = await prisma.item.findMany({
      where: { isActive: true },
      include: {
        category: true,
        unit: true,
        balances: true,
      },
    });

    return items
      .map((item) => {
        const totalAvailable = item.balances.reduce((sum, b) => sum + b.availableQuantity, 0);
        const totalQuantity = item.balances.reduce((sum, b) => sum + b.quantity, 0);
        const isLow = totalAvailable <= item.reorderPoint;
        const isOut = totalAvailable <= 0;
        return {
          ...item,
          totalAvailable,
          totalQuantity,
          isLow,
          isOut,
        };
      })
      .filter((i) => i.isLow || i.isOut);
  }
}
