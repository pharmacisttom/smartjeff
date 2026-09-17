import { prisma } from "@/lib/prisma";

export interface PurchaseSuggestion {
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQty: number;
  estimatedUnitPrice: number;
  estimatedTotalAmount: number;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  reasons: string[];
  rulesApplied: string[];
}

export class ProcurementIntelligenceService {
  /**
   * Generates explainable purchase order suggestions based on stock balance and project requirements.
   * Guardrail: Suggestions require human purchase officer review before final PO generation.
   */
  static async getPurchaseSuggestions(): Promise<PurchaseSuggestion[]> {
    const items = await prisma.inventoryItem.findMany({
      where: { isActive: true },
      include: {
        movements: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    const suggestions: PurchaseSuggestion[] = [];

    for (const item of items) {
      const stockOnHand = item.stockBalance;
      const reorderPoint = item.reorderPoint ?? 10;
      const maxStock = item.maxStock ?? 100;

      if (stockOnHand <= reorderPoint) {
        const suggestedQty = Math.max(1, maxStock - stockOnHand);
        const unitCost = Number(item.unitCost) || 100;

        const reasons: string[] = [
          `จำนวนสินค้าคงคลังปัจจุบัน (${stockOnHand} ${item.unit}) ต่ำกว่าหรือเท่ากับจุดสั่งซื้อใหม่ (${reorderPoint} ${item.unit})`,
          `คำนวณปริมาณสั่งซื้อเพื่อเติมสต็อกให้ถึงระดับสูงสุด (${maxStock} ${item.unit})`,
        ];

        const rulesApplied: string[] = [
          "Rule-01: Reorder Point Trigger (Stock <= ReorderPoint)",
          "Rule-02: Safety Stock Replacement (Qty = MaxStock - CurrentStock)",
        ];

        let urgency: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
        if (stockOnHand === 0) {
          urgency = "HIGH";
          reasons.push("สินค้าหมดสต็อกสมบูรณ์ (Out of Stock Alert)");
        } else if (stockOnHand <= reorderPoint / 2) {
          urgency = "HIGH";
          reasons.push("คงเหลือต่ำกว่า 50% ของจุดสั่งซื้อใหม่");
        } else {
          urgency = "LOW";
        }

        suggestions.push({
          itemId: item.id,
          itemCode: item.code,
          itemName: item.nameTh || item.name,
          unit: item.unit,
          currentStock: stockOnHand,
          reorderPoint,
          suggestedQty,
          estimatedUnitPrice: unitCost,
          estimatedTotalAmount: suggestedQty * unitCost,
          urgency,
          reasons,
          rulesApplied,
        });
      }
    }

    return suggestions.sort((a, b) => {
      const urgencyRank = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return urgencyRank[b.urgency] - urgencyRank[a.urgency];
    });
  }
}
