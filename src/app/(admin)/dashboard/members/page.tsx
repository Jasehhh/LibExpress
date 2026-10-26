import { type Metadata } from "next";

import { PageHeader } from "~/components/admin/page-header";
import { MemberTable } from "~/components/features/members/member-table";
import { api, HydrateClient } from "~/trpc/server";

export const metadata: Metadata = { title: "Members | LibExpress" };

export default function MembersPage() {
  void api.member.getAll.prefetch();

  return (
    <HydrateClient>
      <main className="px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <PageHeader title="Members" />
        {/* The table's first row is the title's subtitle and Add member. */}
        <div className="mt-1">
          <MemberTable />
        </div>
      </main>
    </HydrateClient>
  );
}
