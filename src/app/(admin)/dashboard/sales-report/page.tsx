import { type Metadata } from "next";

import { PageHeader } from "~/components/admin/page-header";
import {
  DEFAULT_PERIOD,
  periodStart,
} from "~/components/features/loans/sales-periods";
import { SalesReport } from "~/components/features/loans/sales-report";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = { title: "Sales Report | LibExpress" };

export default function SalesReportPage() {
  void api.loan.getTransactions.prefetch({
    since: periodStart(DEFAULT_PERIOD),
  });

  return (
    <HydrateClient>
      <main className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <PageHeader title="Sales Report" />
        {/* The report's first row is the period and the export button. */}
        <div className="mt-1">
          <SalesReport />
        </div>
      </main>
    </HydrateClient>
  );
}
