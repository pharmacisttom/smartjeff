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
      await prisma.mfaRecoveryCode.update({ where: { id: recovery.id }, data: { usedAt: new Date() } });
      return true;
    }
  }
  return false;
}
