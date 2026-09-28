import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Staff sign in" };

export default function Page() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
