import type { SessionPayload } from "./auth-jwt";

export const EDGE_COOKIE_NAME = "sj_token";

function decodeBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const decoded = atob(normalized + pad);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}

export async function verifyTokenAtEdge(token: string): Promise<SessionPayload | null> {
  try {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
      console.error("[EDGE AUTH] Secret missing or too short", { len: secret?.length });
      return null;
    }
    const parts = token.split(".");
    if (parts.length !== 3) {
      console.error("[EDGE AUTH] Invalid token parts length", parts.length);
      return null;
    }
    const [headerPart, payloadPart, signaturePart] = parts;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(headerPart))) as { alg?: string };
    if (header.alg !== "HS256") {
      console.error("[EDGE AUTH] Alg not HS256", header.alg);
      return null;
    }
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64Url(signaturePart) as unknown as BufferSource,
      new TextEncoder().encode(`${headerPart}.${payloadPart}`),
    );
    if (!valid) {
      console.error("[EDGE AUTH] Signature verification failed!");
      return null;
    }
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(payloadPart))) as SessionPayload;
    if (!payload.sub || !payload.role || !payload.type) {
      console.error("[EDGE AUTH] Missing payload fields", payload);
      return null;
    }
    if (payload.exp && payload.exp <= Math.floor(Date.now() / 1000)) {
      console.error("[EDGE AUTH] Token expired", payload.exp);
      return null;
    }
    return payload;
  } catch (err) {
    console.error("[EDGE AUTH] Exception in verifyTokenAtEdge:", err);
    return null;
  }
}
