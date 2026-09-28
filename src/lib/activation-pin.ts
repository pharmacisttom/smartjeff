import { randomInt } from "node:crypto";
import argon2 from "argon2";

export const ACTIVATION_PIN_TTL_HOURS = 72;
export const ACTIVATION_PIN_MAX_ATTEMPTS = 5;

export function generateActivationPin(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashActivationPin(pin: string): Promise<string> {
  return argon2.hash(pin, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
}

export async function verifyActivationPin(hash: string, pin: string): Promise<boolean> {
  if (!/^\d{6}$/.test(pin)) return false;
  try { return await argon2.verify(hash, pin); } catch { return false; }
}
