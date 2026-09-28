import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/components/ui/States";
import { ActivityScreen } from "./ActivityScreen";

export const metadata: Metadata = { title: "Activity log" };

// The screen reads its filters from the URL (useSearchParams).
export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ActivityScreen />
    </Suspense>
  );
}
