import bcrypt from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authInput } from "~/lib/schemas/auth";
import { db } from "~/server/db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = authInput.safeParse(credentials);
        if (!parsed.success) return null;

        const admin = await db.admin.findUnique({
          where: { email: parsed.data.email },
        });
        if (!admin) return null;

        const passwordMatches = await bcrypt.compare(
          parsed.data.password,
          admin.passwordHash,
        );
        if (!passwordMatches) return null;

        return { id: admin.id, email: admin.email };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub ?? "",
      },
    }),
  },
} satisfies NextAuthConfig;
