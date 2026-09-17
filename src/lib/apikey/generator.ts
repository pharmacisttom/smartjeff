import crypto from "crypto";

const PREFIX = {
  PUBLIC: "pk_live_",
  SECRET: "sk_live_",
  SYSTEM: "smto_live_",
} as const;

export type ApiKeyTypeInput = keyof typeof PREFIX;

export interface GeneratedApiKey {
  fullKey: string;
  hash: string;
  prefix: string;
  last4: string;
}

export function generateApiKey(type: ApiKeyTypeInput): GeneratedApiKey {
  const prefix = PREFIX[type];
  const randomBytes = crypto.randomBytes(24).toString("hex"); // 48 chars
  const fullKey = `${prefix}${randomBytes}`;
  const hash = crypto.createHash("sha256").update(fullKey).digest("hex");
  const last4 = fullKey.slice(-4);

  return {
    fullKey,
    hash,
    prefix,
    last4,
  };
}

export function hashApiKey(fullKey: string): string {
  return crypto.createHash("sha256").update(fullKey).digest("hex");
}

export function extractPrefix(key: string): string {
  if (key.startsWith("smto_live_")) return "smto_live_";
  if (key.startsWith("sk_live_")) return "sk_live_";
  if (key.startsWith("pk_live_")) return "pk_live_";
  return "unknown_";
}
