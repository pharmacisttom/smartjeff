export interface FleetVehicleInput {
  vehicleType: string; // e.g. "Pickup Truck 4x4", "Van 11-seat", "Motorcycle", "6-Wheel Truck"
  quantity: number;
  trips: number;
  distanceKmPerTrip: number;
  fuelEfficiencyKmPerLiter?: number; // default e.g. 10 km/L
  fuelPricePerLiter?: number; // default e.g. 35 THB/L
  rentalRatePerVehiclePerDay?: number;
  maintenanceAllocationPerTrip?: number; // default e.g. 50 THB
  notes?: string;
}

export interface FleetEstimateResult {
  vehicleType: string;
  quantity: number;
  trips: number;
  totalDistanceKm: number;
  totalFuelLiters: number;
  fuelCost: number;
  rentalCost: number;
  maintenanceCost: number;
  totalFleetCost: number;
  lineItems: Array<{
    category: "FLEET" | "FUEL" | "TRAVEL";
    description: string;
    quantity: number;
    unit: string;
    unitCost: number;
    totalCost: number;
    sourceType: string;
    notes?: string;
  }>;
}

export class FleetEstimationService {
  static calculateVehicleFleetCost(input: FleetVehicleInput): FleetEstimateResult {
    const quantity = Math.max(0, input.quantity);
    const trips = Math.max(0, input.trips);
    const distanceKm = Math.max(0, input.distanceKmPerTrip);
    const efficiency = input.fuelEfficiencyKmPerLiter && input.fuelEfficiencyKmPerLiter > 0 ? input.fuelEfficiencyKmPerLiter : 10;
    const fuelPrice = input.fuelPricePerLiter && input.fuelPricePerLiter > 0 ? input.fuelPricePerLiter : 35;
    const rentalRate = Math.max(0, input.rentalRatePerVehiclePerDay || 0);
    const maintenanceRate = Math.max(0, input.maintenanceAllocationPerTrip || 0);

    const totalDistanceKm = quantity * trips * distanceKm;
    const totalFuelLiters = efficiency > 0 ? totalDistanceKm / efficiency : 0;
    const fuelCost = Math.round(totalFuelLiters * fuelPrice);
    const rentalCost = quantity * trips * rentalRate;
    const maintenanceCost = quantity * trips * maintenanceRate;
    const totalFleetCost = fuelCost + rentalCost + maintenanceCost;

    const lineItems: FleetEstimateResult["lineItems"] = [];

    if (rentalCost > 0) {
      lineItems.push({
        category: "FLEET",
        description: `Vehicle Rental/Allocation: ${input.vehicleType} (${quantity} units x ${trips} trips)`,
        quantity: quantity * trips,
        unit: "vehicle-trip",
        unitCost: rentalRate,
        totalCost: rentalCost,
        sourceType: "FLEET_FORMULA",
        notes: input.notes,
      });
    }

    if (fuelCost > 0) {
      lineItems.push({
        category: "FUEL",
        description: `Fuel: ${input.vehicleType} (${totalDistanceKm.toLocaleString()} km @ ${efficiency} km/L)`,
        quantity: Math.round(totalFuelLiters),
        unit: "liter",
        unitCost: fuelPrice,
        totalCost: fuelCost,
        sourceType: "FLEET_FORMULA",
        notes: `Assumption: ${fuelPrice.toFixed(2)} THB/L, ${efficiency} km/L`,
      });
    }

    if (maintenanceCost > 0) {
      lineItems.push({
        category: "TRAVEL",
        description: `Fleet Maintenance Allocation: ${input.vehicleType} (${quantity * trips} trips)`,
        quantity: quantity * trips,
        unit: "trip",
        unitCost: maintenanceRate,
        totalCost: maintenanceCost,
        sourceType: "FLEET_FORMULA",
      });
    }

    return {
      vehicleType: input.vehicleType,
      quantity,
      trips,
      totalDistanceKm,
      totalFuelLiters,
      fuelCost,
      rentalCost,
      maintenanceCost,
      totalFleetCost,
      lineItems,
    };
  }

  static calculateFleetEstimate(vehicles: FleetVehicleInput[]) {
    let totalFuel = 0;
    let totalRental = 0;
    let totalMaintenance = 0;
    const allLineItems: FleetEstimateResult["lineItems"] = [];

    for (const v of vehicles) {
      const result = this.calculateVehicleFleetCost(v);
      totalFuel += result.fuelCost;
      totalRental += result.rentalCost;
      totalMaintenance += result.maintenanceCost;
      allLineItems.push(...result.lineItems);
    }

    return {
      totalFuelCost: totalFuel,
      totalRentalCost: totalRental,
      totalMaintenanceCost: totalMaintenance,
      totalDirectFleetCost: totalFuel + totalRental + totalMaintenance,
      lineItems: allLineItems,
    };
  }
}
