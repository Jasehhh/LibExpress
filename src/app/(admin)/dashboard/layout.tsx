import { redirect } from "next/navigation";

import { Sidebar } from "~/components/admin/sidebar";
import { auth, signOut } from "~/server/auth";

// Every staff page reads the signed-in session and live data, so none of
// them can be prerendered at build time. Without this, the loading.tsx
// boundaries let Next try to prerender the pages below and the build fails.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) redirect("/login");

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  // The navy sidebar frames a rounded page panel on desktops.
  return (
    <div className="bg-navy min-h-screen lg:flex">
      <Sidebar signOutAction={signOutAction} />
      <div className="min-w-0 flex-1 lg:py-4 lg:pr-4">
        <div className="bg-background min-h-full lg:min-h-[calc(100vh-2rem)] lg:rounded-[2rem]">
          {children}
        </div>
      </div>
    </div>
  );
}
