import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const email = (await prompt.question("Admin email: ")).trim().toLowerCase();
    const name = (await prompt.question("Display name: ")).trim();
    const password = await prompt.question("Password (minimum 12 characters): ");

    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("A valid email is required");
    if (!name) throw new Error("Display name is required");
    if (password.length < 12) throw new Error("Password must contain at least 12 characters");
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      throw new Error("Password must include lowercase, uppercase, and a number");
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email },
      update: { displayName: name, passwordHash, role: "ADMIN", isActive: true, isLocked: false },
      create: { email, displayName: name, passwordHash, role: "ADMIN" },
    });
    stdout.write("Admin account created or updated securely.\n");
  } finally {
    prompt.close();
  }
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unable to create admin";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
