import bcrypt from "bcryptjs";

import prisma from "../generated/prisma/index.js";

const [rawEmail, password] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();

if (!email || !password) {
  console.error("Usage: npm run create-admin -- <email> <password>");
  process.exit(1);
}
if (!/^\S+@\S+\.\S+$/.test(email)) {
  console.error("Must be a valid email.");
  process.exit(1);
}
if (password.length < 6) {
  console.error("Password must be at least 6 characters.");
  process.exit(1);
}

const db = new prisma.PrismaClient();

try {
  const existing = await db.admin.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 10);
  if (existing?.passwordHash) {
    console.error(`${email} is already registered.`);
    process.exitCode = 1;
  } else if (existing) {
    // Admins carried over from the old schema have an empty password.
    await db.admin.update({ where: { email }, data: { passwordHash } });
    console.log(`Set a password for ${email}.`);
  } else {
    const admin = await db.admin.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    console.log(`Created ${admin.email} (${admin.id}).`);
  }
} finally {
  await db.$disconnect();
}
