import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "./generator";

export interface ApiKeyRecord { id: string; name: string; type: "PUBLIC" | "SECRET" | "SYSTEM"; scopes: string[]; allowedIps: string[]; tenantId?: string; status: "ACTIVE" | "REVOKED" | "EXPIRED" }

export async function validateApiKeyRequest(req: NextRequest, requiredScope?: string): Promise<ApiKeyRecord | null> {
  const authHeader = req.headers.get("authorization");
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : req.headers.get("x-api-key");
  if (!apiKey) return null;
  const stored = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(apiKey) } });
  if (!stored || stored.status !== "ACTIVE" || (stored.expiresAt && stored.expiresAt <= new Date())) return null;
  const scopes = Array.isArray(stored.scopes) ? stored.scopes.filter((item): item is string => typeof item === "string") : [];
  const allowedIps = Array.isArray(stored.allowedIps) ? stored.allowedIps.filter((item): item is string => typeof item === "string") : [];
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (allowedIps.length && (!forwarded || !allowedIps.includes(forwarded))) return null;
  if (requiredScope && !scopes.includes(requiredScope) && stored.type !== "SYSTEM") return null;
  await prisma.apiKey.update({ where: { id: stored.id }, data: { lastUsedAt: new Date() } });
  return { id: stored.id, name: stored.name, type: stored.type as ApiKeyRecord["type"], scopes, allowedIps, tenantId: stored.tenantId ?? undefined, status: "ACTIVE" };
}
