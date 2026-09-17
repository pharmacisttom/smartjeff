import { createInterface } from "node:readline/promises";
import { randomBytes } from "node:crypto";
import { stdin, stdout } from "node:process";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { encryptToken } from "../src/lib/crypto/encrypt";
import { generateTotpSecret, totpUri } from "../src/lib/mfa/totp";

const prisma = new PrismaClient();
const prompt = createInterface({ input: stdin, output: stdout });
async function main() {
  const email = (await prompt.question("User email: ")).trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } }); if (!user) throw new Error("User not found");
  const secret = generateTotpSecret();
  const recoveryCodes = Array.from({ length: 10 }, () => randomBytes(5).toString("hex").toUpperCase());
  const hashes = await Promise.all(recoveryCodes.map((value) => argon2.hash(value, { type: argon2.argon2id })));
  await prisma.$transaction(async (tx) => { await tx.mfaRecoveryCode.deleteMany({ where: { userId: user.id } }); await tx.user.update({ where: { id: user.id }, data: { mfaSecret: encryptToken(secret), mfaEnabled: true } }); await tx.mfaRecoveryCode.createMany({ data: hashes.map((codeHash) => ({ userId: user.id, codeHash })) }); });
  stdout.write(`Authenticator URI:\n${totpUri(secret, email, process.env.TOTP_ISSUER || "SmartJeff")}\n\nRecovery codes (store securely; shown once):\n${recoveryCodes.join("\n")}\n`);
}
main().catch((error) => { process.stderr.write(`${error instanceof Error ? error.message : "MFA setup failed"}\n`); process.exitCode = 1; }).finally(async () => { prompt.close(); await prisma.$disconnect(); });
