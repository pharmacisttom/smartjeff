export interface ExpenseCalculationInput {
  distanceKm: number;
  ratePerKm?: number; // Default 5 THB/km
  vehicleType?: "motorcycle" | "car" | "public";
  tollFee?: number;
}

export function calculateTravelExpense(input: ExpenseCalculationInput): {
  distanceKm: number;
  ratePerKm: number;
  mileageCost: number;
  tollFee: number;
  totalCost: number;
} {
  const ratePerKm = input.ratePerKm || (input.vehicleType === "motorcycle" ? 4 : 5);
  const mileageCost = Math.round(input.distanceKm * ratePerKm * 100) / 100;
  const tollFee = input.tollFee || 0;
  const totalCost = mileageCost + tollFee;

  return {
    distanceKm: input.distanceKm,
    ratePerKm,
    mileageCost,
    tollFee,
    totalCost,
  };
}
