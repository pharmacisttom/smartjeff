import { NextRequest } from "next/server";
import { hashApiKey } from "./generator";

export interface ApiKeyRecord {
  id: string;
  name: string;
  type: "PUBLIC" | "SECRET" | "SYSTEM";
  scopes: string[];
  allowedIps: string[];
  tenantId?: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
}

// In-memory mock API Key store for system integrations
const mockApiKeys: Record<string, ApiKeyRecord> = {};

export async function validateApiKeyRequest(req: NextRequest, requiredScope?: string): Promise<ApiKeyRecord | null> {
  const authHeader = req.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "") || req.headers.get("x-api-key");

  if (!apiKey) return null;

  const keyHash = hashApiKey(apiKey);
  const record = mockApiKeys[keyHash];

  if (!record || record.status !== "ACTIVE") {
    return null;
  }

  if (requiredScope && !record.scopes.includes(requiredScope) && record.type !== "SYSTEM") {
    return null;
  }

  return record;
}
