"use client";

import { useState } from "react";

import { formatMoney } from "~/components/features/fines/money";
import { DeleteMemberDialog } from "~/components/features/members/delete-member-dialog";
import { MemberFormDialog } from "~/components/features/members/member-form-dialog";
import { MemberViewDialog } from "~/components/features/members/member-view-dialog";
import {
  ACTION_ICONS,
  FilterSelect,
  IconButton,
  Pagination,
  SearchInput,
  TABLE_HEAD_CLASS,
  TableCard,
  TableEmpty,
  TableIntro,
} from "~/components/ui/data-table";
import { Pill } from "~/components/ui/pill";
import { TIME_ZONE } from "~/lib/time";
import { type Member, type MemberStatus } from "~/lib/types";
import { api } from "~/trpc/react";

const PAGE_SIZE = 10;

const count = new Intl.NumberFormat("en-PH");
const joined = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

const fullName = (member: Member) => `${member.firstName} ${member.lastName}`;

export function MemberTable() {
  const [members] = api.member.getAll.useSuspenseQuery();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<MemberStatus | "">("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);

  const needle = query.trim().toLowerCase();
  const filtered = members.filter(
    (member) =>
      (!needle ||
        `${fullName(member)} ${member.email}`.toLowerCase().includes(needle)) &&
      (!status || member.status === status),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const active = members.filter((member) => member.status === "ACTIVE").length;

  // The open dialog shows the latest copy of the member after a refetch.
  const fresh = (member: Member | null) =>
    member && (members.find((m) => m.id === member.id) ?? member);

  return (
    <>
      <TableIntro
        summary={`${count.format(members.length)} ${members.length === 1 ? "member" : "members"}, ${count.format(active)} active. Add members, see what they have borrowed and record fine payments.`}
        addLabel="Add member"
        onAdd={() => setAdding(true)}
      />

      <TableCard
        label="Members"
        toolbar={
          <>
            <SearchInput
              id="member-filter"
              label="Search members"
              value={query}
              onChange={(value) => {
                setQuery(value);
                setPage(1);
              }}
              placeholder="Search by name or email"
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={(value) => {
                setStatus(value as MemberStatus | "");
                setPage(1);
              }}
              options={[
                ["", "Any status"],
                ["ACTIVE", "Active"],
                ["SUSPENDED", "Suspended"],
              ]}
            />
          </>
        }
      >
        {shown.length > 0 ? (
          <table className="w-full table-fixed text-left text-sm">
            <thead className={TABLE_HEAD_CLASS}>
              <tr>
                <th scope="col" className="px-3 py-3 font-medium sm:px-5">
                  Member
                </th>
                <th
                  scope="col"
                  className="hidden w-36 px-5 py-3 font-medium lg:table-cell"
                >
                  Joined
                </th>
                <th
                  scope="col"
                  className="hidden w-28 px-5 py-3 font-medium md:table-cell"
                >
                  Books out
                </th>
                <th
                  scope="col"
                  className="hidden w-32 px-5 py-3 font-medium md:table-cell"
                >
                  Unpaid fines
                </th>
                <th
                  scope="col"
                  className="hidden w-32 px-5 py-3 font-medium sm:table-cell"
                >
                  Status
                </th>
                <th scope="col" className="w-44 px-3 py-3 sm:px-5">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {shown.map((member) => {
                const owes = Number(member.unpaidFinesTotal) > 0;
                const suspended = member.status === "SUSPENDED";
                return (
                  <tr key={member.id} className="hover:bg-background">
                    <td className="px-3 py-3 sm:px-5">
                      <p className="text-foreground truncate font-semibold">
                        {fullName(member)}
                      </p>
                      <p className="text-muted truncate">{member.email}</p>
                    </td>
                    <td className="text-muted hidden px-5 py-3 whitespace-nowrap lg:table-cell">
                      {joined.format(member.createdAt)}
                    </td>
                    <td className="hidden px-5 py-3 tabular-nums md:table-cell">
                      {member.activeLoansCount}
                    </td>
                    <td
                      className={`hidden px-5 py-3 tabular-nums md:table-cell ${owes ? "text-danger font-semibold" : "text-muted"}`}
                    >
                      {formatMoney(member.unpaidFinesTotal)}
                    </td>
                    <td className="hidden px-5 py-3 sm:table-cell">
                      <Pill tone={suspended ? "bad" : "good"}>
                        {suspended ? "Suspended" : "Active"}
                      </Pill>
                    </td>
                    <td className="px-3 py-3 sm:px-5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewing(member)}
                          className="border-border text-navy hover:bg-surface-muted focus-visible:ring-primary-light mr-1 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
                        >
                          View
                        </button>
                        <IconButton
                          label={`Edit ${fullName(member)}`}
                          onClick={() => setEditing(member)}
                        >
                          {ACTION_ICONS.edit}
                        </IconButton>
                        <IconButton
                          label={`Delete ${fullName(member)}`}
                          onClick={() => setDeleting(member)}
                          danger
                        >
                          {ACTION_ICONS.delete}
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : needle || status ? (
          <TableEmpty
            title="No members match these filters."
            onClear={() => {
              setQuery("");
              setStatus("");
              setPage(1);
            }}
          />
        ) : (
          <TableEmpty
            title="No members yet."
            body="Add the first member so books can go out."
          />
        )}

        {filtered.length > 0 && (
          <Pagination
            page={current}
            pageSize={PAGE_SIZE}
            shown={shown.length}
            total={filtered.length}
            onPage={setPage}
          />
        )}
      </TableCard>

      <MemberFormDialog
        open={adding || !!editing}
        member={editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
      />
      <MemberViewDialog
        member={fresh(viewing)}
        onClose={() => setViewing(null)}
      />
      <DeleteMemberDialog member={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
