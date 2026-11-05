import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "~/server/auth/config";

const { auth } = NextAuth(authConfig);

// Send signed-out visitors to /login before any staff page renders. The
// dashboard layout also checks, but Next renders a layout and its page side by
// side, so a page's prefetch would already have hit the API and failed with
// UNAUTHORIZED by the time the layout redirected.
export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
  // The auth config reads admins through Prisma, which can't run on the edge.
  runtime: "nodejs",
};
