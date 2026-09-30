/**
 * Longdo Map Configuration & Key Security Layer
 * SmartOP / SmartJeff Enterprise Operations Platform
 */

export const LONGDO_CONFIG = {
  // Browser Key (Public API Key for Longdo Map JavaScript SDK / Map API 3)
  get browserKey(): string {
    return (
      process.env.NEXT_PUBLIC_LONGDO_MAP_KEY ||
      process.env.LONGDO_API_KEY ||
      ""
    );
  },

  // Server Key (Private Secret Key for Longdo REST web service endpoints)
  get serverKey(): string {
    return (
      process.env.LONGDO_API_KEY ||
      process.env.NEXT_PUBLIC_LONGDO_MAP_KEY ||
      ""
    );
  },

  // Map Feature Toggle
  get isEnabled(): boolean {
    return process.env.LONGDO_MAP_ENABLED !== "false" && Boolean(this.browserKey || this.serverKey);
  },

  // REST API Endpoints according to official Longdo documentation
  endpoints: {
    scriptSdkV2: "https://api.longdo.com/map/",
    scriptSdkV3: "https://api.longdo.com/map3/",
    reverseGeocode: "https://api.longdo.com/map/services/address",
    search: "https://api.longdo.com/map/services/search",
    suggest: "https://api.longdo.com/map/services/suggest",
    nearby: "https://api.longdo.com/map/services/nearby",
    route: "https://api.longdo.com/RouteServer/getRoute",
    matrix: "https://api.longdo.com/RouteServer/matrix",
    coverage: "https://api.longdo.com/RouteServer/coverage",
    traffic: "https://api.longdo.com/map/services/traffic",
  },

  // Production Domain Whitelist / Verification
  productionDomain: "smartop.tomvisolution.tech",

  // Default Operational Center (Thailand Eastern Seaboard / Rayong Industrial Center)
  defaultCenter: {
    lat: 13.0039,
    lng: 101.1668,
    name: "เหมราช/อมตะ ซิตี้ ระยอง",
  },
  defaultZoom: 11,

  // Quota Thresholds
  usageWarningThresholdPercent: Number(process.env.LONGDO_USAGE_WARNING_THRESHOLD) || 80,
  dailyQuotaMax: 100000, // Configurable threshold for alert monitoring
};

// Internal API Quota Counter (In-Memory Audit Buffer)
const quotaState = {
  dailyCount: 0,
  errorCount: 0,
  lastResetDate: new Date().toISOString().split("T")[0],
  endpointStats: {} as Record<string, number>,
};

export function recordLongdoApiRequest(endpointName: string, success: boolean = true) {
  const currentDate = new Date().toISOString().split("T")[0];
  if (quotaState.lastResetDate !== currentDate) {
    quotaState.dailyCount = 0;
    quotaState.errorCount = 0;
    quotaState.endpointStats = {};
    quotaState.lastResetDate = currentDate;
  }

  quotaState.dailyCount += 1;
  quotaState.endpointStats[endpointName] = (quotaState.endpointStats[endpointName] || 0) + 1;
  if (!success) {
    quotaState.errorCount += 1;
  }
}

export function getLongdoQuotaStats() {
  return {
    dailyCount: quotaState.dailyCount,
    errorCount: quotaState.errorCount,
    lastResetDate: quotaState.lastResetDate,
    endpointStats: { ...quotaState.endpointStats },
  };
}
