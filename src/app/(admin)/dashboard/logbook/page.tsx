import { type Metadata } from "next";

import { PageHeader } from "~/components/admin/page-header";
import { Logbook } from "~/components/features/loans/logbook";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = { title: "Logbook | LibExpress" };

export default function LogbookPage() {
  void api.loan.getTransactions.prefetch();

  return (
    <HydrateClient>
      <main className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <PageHeader title="Logbook" />
        {/* The logbook's first row is the period and the export button. */}
        <div className="mt-1">
          <Logbook />
        </div>
      </main>
    </HydrateClient>
  );
}
