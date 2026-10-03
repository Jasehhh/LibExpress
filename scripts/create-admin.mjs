// Creates a staff account that can sign in at /api/auth/signin.
// Usage: npm run create-admin -- <email> <password>
import bcrypt from "bcryptjs";

import prisma from "../generated/prisma/index.js";

const [email, password] = process.argv.slice(2);

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
  if (existing) {
    console.error(`${email} is already registered.`);
    process.exitCode = 1;
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await db.admin.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    console.log(`Created ${admin.email} (${admin.id}).`);
  }
} finally {
  await db.$disconnect();
}
