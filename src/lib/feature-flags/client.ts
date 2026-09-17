export interface FeatureFlag {
  key: string;
  name: string;
  enabledGlobally: boolean;
  enabledTenants: string[];
  rolloutPercent: number;
}

export function isFeatureEnabled(flag: FeatureFlag, tenantId: string): boolean {
  if (flag.enabledGlobally) return true;
  if (flag.enabledTenants.includes(tenantId)) return true;

  if (flag.rolloutPercent > 0) {
    let hash = 0;
    const str = `${flag.key}:${tenantId}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const normalized = Math.abs(hash) % 100;
    return normalized < flag.rolloutPercent;
  }

  return false;
}
