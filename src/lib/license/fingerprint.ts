import crypto from "crypto";

export function generateFingerprint(components: {
  domain: string;
  instanceId: string;
  publicIp?: string;
}): string {
  const raw = `${components.domain}|${components.instanceId}|${components.publicIp ?? ""}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

let cachedInstanceId: string | null = null;

export async function getInstanceId(): Promise<string> {
  if (cachedInstanceId) return cachedInstanceId;
  if (process.env.SMARTO_INSTANCE_ID) {
    cachedInstanceId = process.env.SMARTO_INSTANCE_ID;
    return cachedInstanceId;
  }

  // Generate deterministic or fixed fallback UUID
  cachedInstanceId = "SMARTO-INSTANCE-J2K-RAYONG-2026";
  return cachedInstanceId;
}
