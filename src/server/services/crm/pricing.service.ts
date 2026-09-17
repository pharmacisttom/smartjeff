export interface PricingInput {
  estimatedCost: number;
  targetMarginPercent?: number; // e.g. 20%
  targetMarginAmount?: number;
  commercialAdjustment?: number; // +/- adjustment
  discountAmount?: number;
  taxPercent?: number; // default 7% VAT
  minimumMarginThresholdPercent?: number; // default 15%
}

export interface PricingResult {
  estimatedCost: number;
  targetMarginPercent: number;
  targetMarginAmount: number;
  commercialAdjustment: number;
  subtotalBeforeDiscount: number;
  discountAmount: number;
  subtotalAfterDiscount: number;
  taxAmount: number;
  taxPercent: number;
  finalPrice: number;
  effectiveMarginAmount: number;
  effectiveMarginPercent: number;
  guardrailWarnings: string[];
  requiresExecutiveApproval: boolean;
  approvalRequiredReason?: string;
}

export class PricingService {
  static calculatePricing(input: PricingInput): PricingResult {
    const estimatedCost = Math.max(0, input.estimatedCost);
    let targetMarginPercent = input.targetMarginPercent ?? 20.0;
    let targetMarginAmount = input.targetMarginAmount;

    if (targetMarginAmount === undefined || targetMarginAmount === null) {
      if (targetMarginPercent < 100 && targetMarginPercent > 0) {
        const basePrice = estimatedCost / (1 - targetMarginPercent / 100);
        targetMarginAmount = Math.round(basePrice - estimatedCost);
      } else {
        targetMarginAmount = Math.round(estimatedCost * (targetMarginPercent / 100));
      }
    }

    const commercialAdjustment = input.commercialAdjustment || 0;
    const subtotalBeforeDiscount = estimatedCost + targetMarginAmount + commercialAdjustment;

    const discountAmount = Math.max(0, input.discountAmount || 0);
    const subtotalAfterDiscount = Math.max(0, subtotalBeforeDiscount - discountAmount);

    const taxPercent = input.taxPercent ?? 7.0;
    const taxAmount = Math.round(subtotalAfterDiscount * (taxPercent / 100));
    const finalPrice = subtotalAfterDiscount + taxAmount;

    // Effective Gross Margin: (SubtotalAfterDiscount - EstimatedCost) / SubtotalAfterDiscount
    const effectiveMarginAmount = subtotalAfterDiscount - estimatedCost;
    const effectiveMarginPercent =
      subtotalAfterDiscount > 0
        ? parseFloat(((effectiveMarginAmount / subtotalAfterDiscount) * 100).toFixed(2))
        : 0;

    // Guardrail Checks
    const guardrailWarnings: string[] = [];
    let requiresExecutiveApproval = false;
    const minMarginThreshold = input.minimumMarginThresholdPercent ?? 15.0;

    if (subtotalAfterDiscount < estimatedCost) {
      guardrailWarnings.push(
        `CRITICAL: Selling price (${subtotalAfterDiscount.toLocaleString()} THB) is below total estimated cost (${estimatedCost.toLocaleString()} THB). This contract will incur an operating deficit.`
      );
      requiresExecutiveApproval = true;
    } else if (effectiveMarginPercent < minMarginThreshold) {
      guardrailWarnings.push(
        `WARNING: Effective gross margin (${effectiveMarginPercent}%) is below company policy threshold (${minMarginThreshold}%).`
      );
      requiresExecutiveApproval = true;
    }

    if (discountAmount > 0 && discountAmount > subtotalBeforeDiscount * 0.1) {
      guardrailWarnings.push(
        `WARNING: Discount amount (${discountAmount.toLocaleString()} THB) exceeds 10% of subtotal. Commercial approval required.`
      );
      requiresExecutiveApproval = true;
    }

    return {
      estimatedCost,
      targetMarginPercent,
      targetMarginAmount,
      commercialAdjustment,
      subtotalBeforeDiscount,
      discountAmount,
      subtotalAfterDiscount,
      taxAmount,
      taxPercent,
      finalPrice,
      effectiveMarginAmount,
      effectiveMarginPercent,
      guardrailWarnings,
      requiresExecutiveApproval,
      approvalRequiredReason: guardrailWarnings.join(" | ") || undefined,
    };
  }
}
