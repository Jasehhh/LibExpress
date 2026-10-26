import { type Metadata } from "next";

import { PageHeader } from "~/components/admin/page-header";
import { CheckoutForm } from "~/components/features/loans/checkout-form";
import { RecentTransactions } from "~/components/features/loans/recent-transactions";
import { ReturnForm } from "~/components/features/loans/return-form";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = { title: "Transactions | LibExpress" };

export default function TransactionsPage() {
  void api.book.getAll.prefetch();
  void api.member.getAll.prefetch();
  void api.loan.getOpen.prefetch();
  void api.dashboard.activity.prefetch();

  return (
    <HydrateClient>
      <main className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <PageHeader
          title="Transactions"
          description="Check books out and take them back in."
        />

        <div className="mt-8 grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <CheckoutForm />
            <ReturnForm />
          </div>
          <RecentTransactions />
        </div>
      </main>
    </HydrateClient>
  );
}
