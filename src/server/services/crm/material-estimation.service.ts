import { prisma } from "@/lib/prisma";

export interface MaterialItemInput {
  itemId?: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  sourceType?: "STANDARD_COST" | "LAST_PURCHASE" | "SUPPLIER_QUOTE" | "MANUAL_ESTIMATE";
  sourceReference?: string;
  notes?: string;
}

export class MaterialEstimationService {
  /**
   * Resolve unit cost from Item Master, Supplier Quotations, or manual input
   */
  static async resolveMaterialCost(item: MaterialItemInput) {
    let unitCost = item.unitCost || 0;
    let sourceType = item.sourceType || "MANUAL_ESTIMATE";
    let sourceReference = item.sourceReference;

    if (item.itemId) {
      const dbItem = await prisma.item.findUnique({
        where: { id: item.itemId },
        include: { poItems: { take: 1 } },
      });

      if (dbItem) {
        if (!unitCost || unitCost === 0) {
          if (dbItem.standardCost && dbItem.standardCost > 0) {
            unitCost = dbItem.standardCost;
            sourceType = "STANDARD_COST";
            sourceReference = `Item Master: ${dbItem.code}`;
          } else if (dbItem.poItems && dbItem.poItems.length > 0) {
            unitCost = dbItem.poItems[0].unitPrice;
            sourceType = "LAST_PURCHASE";
            sourceReference = `Purchase Order Line`;
          }
        }
      }
    }

    const totalCost = Math.round(item.quantity * unitCost);

    return {
      category: "MATERIAL",
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitCost,
      totalCost,
      sourceType,
      sourceReference,
      notes: item.notes,
    };
  }

  static async calculateMaterialEstimate(items: MaterialItemInput[]) {
    let totalMaterialCost = 0;
    const lineItems = [];

    for (const item of items) {
      const resolved = await this.resolveMaterialCost(item);
      totalMaterialCost += resolved.totalCost;
      lineItems.push(resolved);
    }

    return {
      totalMaterialCost,
      lineItems,
    };
  }
}
