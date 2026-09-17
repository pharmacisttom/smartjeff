import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

function readRequired(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function upsertAccount(account) {
  const passwordHash = await argon2.hash(account.password, {
    type: argon2.argon2id,
  });

  await prisma.user.upsert({
    where: { email: account.username.toLowerCase() },
    update: {
      passwordHash,
      displayName: account.displayName,
      role: account.role,
      type: "INTERNAL",
      isActive: true,
      isLocked: false,
      lockedAt: null,
      mustChangePassword: false,
    },
    create: {
      email: account.username.toLowerCase(),
      passwordHash,
      displayName: account.displayName,
      role: account.role,
      type: "INTERNAL",
      isActive: true,
      isLocked: false,
      mustChangePassword: false,
    },
  });

  process.stdout.write(`Provisioned ${account.role} account: ${account.username}\n`);
}

async function main() {
  const accounts = [
    {
      username: readRequired("ADMIN_USERNAME"),
      password: readRequired("ADMIN_PASSWORD"),
      displayName: process.env.ADMIN_DISPLAY_NAME?.trim() || "Administrator",
      role: "ADMIN",
    },
    {
      username: readRequired("USER_USERNAME"),
      password: readRequired("USER_PASSWORD"),
      displayName: process.env.USER_DISPLAY_NAME?.trim() || "Star",
      role: "EMPLOYEE",
    },
  ];

  for (const account of accounts) {
    await upsertAccount(account);
  }
}

main()
  .catch((error) => {
    const message = error instanceof Error ? error.message : "Unable to provision login users";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
