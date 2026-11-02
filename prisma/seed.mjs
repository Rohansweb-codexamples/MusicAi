// Seeds the first administrator account from ADMIN_EMAIL / ADMIN_PASSWORD.
// Idempotent: safe to run on every boot.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = (process.env.ADMIN_EMAIL || "admin@musicai.studio").toLowerCase();
const password = process.env.ADMIN_PASSWORD || "changeme-admin";
const name = process.env.ADMIN_NAME || "Studio Admin";

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    await prisma.user.create({
      data: { email, name, passwordHash: await bcrypt.hash(password, 11), role: "ADMIN" },
    });
    console.log(`[seed] created admin account ${email}`);
  } else if (existing.role !== "ADMIN") {
    await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
    console.log(`[seed] promoted ${email} to admin`);
  } else {
    console.log(`[seed] admin account ${email} already present`);
  }
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
