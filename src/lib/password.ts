import argon2 from "argon2";
import bcrypt from "bcryptjs";

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 });
}

export async function verifyPassword(hash: string | null, password: string): Promise<boolean> {
  if (!hash) return false;
  try {
    if (hash.startsWith("$argon2id$")) return await argon2.verify(hash, password);
    // Preserve verification of existing individual bcrypt hashes during migration.
    if (/^\$2[aby]\$/.test(hash)) return await bcrypt.compare(password, hash);
    return false;
  } catch { return false; }
}
