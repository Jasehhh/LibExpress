import type { Metadata } from "next";
import { StaffShell } from "@/components/admin/StaffShell";

export const metadata: Metadata = {
  title: { default: "Staff desk", template: "%s | LibExpress staff" },
  robots: { index: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <StaffShell>{children}</StaffShell>;
}
