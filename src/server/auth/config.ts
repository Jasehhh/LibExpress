import bcrypt from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authInput } from "~/lib/schemas/auth";
import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * Staff sign in with the email and password of an admin account. Accounts are added with the
 * `auth.register` tRPC procedure.
 *
 * @see https://next-auth.js.org/configuration/options
 */
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
  // Credentials sign-in only works with JWT sessions. They last a day, like
  // the old API tokens.
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
