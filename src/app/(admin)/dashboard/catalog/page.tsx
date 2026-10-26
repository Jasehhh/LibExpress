import { type Metadata } from "next";

import { PageHeader } from "~/components/admin/page-header";
import { CatalogTable } from "~/components/features/books/catalog-table";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = { title: "Catalog | LibExpress" };

export default function CatalogPage() {
  void api.book.getAll.prefetch();
  void api.author.getAll.prefetch();

  return (
    <HydrateClient>
      <main className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <PageHeader title="Catalog" />
        {/* The table's first row is the title's subtitle and Add book. */}
        <div className="mt-1">
          <CatalogTable />
        </div>
      </main>
    </HydrateClient>
  );
}
