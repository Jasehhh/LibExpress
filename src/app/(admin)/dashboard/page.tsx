import { type Metadata } from "next";

import { ActivityFeed } from "~/components/admin/activity-feed";
import { LibraryOverview } from "~/components/admin/library-overview";
import { PageHeader } from "~/components/admin/page-header";
import { Today } from "~/components/admin/today";
import { PopularBooks } from "~/components/features/books/popular-books";
import { CirculationChart } from "~/components/features/loans/circulation-chart";
import { OverdueLoans } from "~/components/features/loans/overdue-loans";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = { title: "Dashboard | LibExpress" };

export default function DashboardPage() {
  void api.dashboard.get.prefetch();

  return (
    <HydrateClient>
      <main className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <PageHeader title="Overview" description={<Today />} />

        <div className="mt-8 grid gap-6">
          <LibraryOverview />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <CirculationChart />
            <ActivityFeed />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PopularBooks />
            <OverdueLoans />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
