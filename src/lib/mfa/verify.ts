import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { decryptToken } from "@/lib/crypto/encrypt";
import { verifyTotp } from "./totp";

export async function verifyMfaCode(userId: string, encryptedSecret: string | null, candidate: string): Promise<boolean> {
  const normalized = candidate.trim().toUpperCase();
  if (encryptedSecret && verifyTotp(decryptToken(encryptedSecret), normalized)) return true;
  const codes = await prisma.mfaRecoveryCode.findMany({ where: { userId, usedAt: null } });
  for (const recovery of codes) {
    if (await bcrypt.compare(normalized, recovery.codeHash)) {
      const consumed = await prisma.mfaRecoveryCode.updateMany({ where: { id: recovery.id, usedAt: null }, data: { usedAt: new Date() } });
      return consumed.count === 1;
    }
  }
  return false;
}
