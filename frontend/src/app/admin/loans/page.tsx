import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/States";
import { LoansScreen } from "./LoansScreen";

export const metadata: Metadata = { title: "Loans" };

// The screen reads its filters from the URL (useSearchParams).
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoansScreen />
    </Suspense>
  );
}
