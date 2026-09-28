"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { fetchLoans } from "@/app/api/loanService";
import { deleteMember, fetchMembers } from "@/app/api/memberService";
import { MemberForm } from "@/components/admin/MemberForm";
import { useStaff } from "@/components/admin/StaffShell";
import { MemberStatusBadge, RoleBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FilterTabs, PageHeader, SearchBox } from "@/components/ui/Controls";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Table, TBody, Td, Th, THead } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatMoney, fullName, plural } from "@/lib/format";
import { openLoanCounts } from "@/lib/loans";
import { useQuery } from "@/lib/useQuery";
import { Member } from "@/lib/types/member";

type StatusFilter = "all" | "ACTIVE" | "SUSPENDED" | "owing";

export function MembersScreen() {
  const { token } = useStaff();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [editing, setEditing] = useState<Member | "new" | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);

  const load = useCallback(
    () => Promise.all([fetchMembers(token), fetchLoans(token)]).then(([members, loans]) => ({ members, loans })),
    [token],
  );
  const { data, error, reload } = useQuery(load);

  const booksOut = useMemo(() => openLoanCounts(data?.loans), [data]);

  const members = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.members ?? [])
      .filter((member) => {
        if (filter === "owing" && Number(member.unpaid_fines_total) <= 0) return false;
        if ((filter === "ACTIVE" || filter === "SUSPENDED") && member.status !== filter) return false;
        return !needle || `${fullName(member)} ${member.email}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`));
  }, [data, query, filter]);

  const counts = useMemo(() => {
    const all = data?.members ?? [];
    return {
      active: all.filter((m) => m.status === "ACTIVE").length,
      suspended: all.filter((m) => m.status === "SUSPENDED").length,
      owing: all.filter((m) => Number(m.unpaid_fines_total) > 0).length,
    };
  }, [data]);

  return (
    <>
      <PageHeader
        title="Members"
        description={data ? `${plural(data.members.length, "library member")}.` : "People who can borrow books."}
        actions={
          <Button onClick={() => setEditing("new")} disabled={!data}>
            Add member
          </Button>
        }
      />

      {error && !data && <ErrorState message={error.message} onRetry={reload} />}
      {!data && !error && <LoadingState label="Loading members" />}

      {data && (
        <>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
            <SearchBox value={query} onChange={setQuery} label="Search members" placeholder="Search name or email" className="md:w-80" />
            <FilterTabs<StatusFilter>
              label="Filter members"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: data.members.length },
                { value: "ACTIVE", label: "Active", count: counts.active },
                { value: "SUSPENDED", label: "Suspended", count: counts.suspended },
                { value: "owing", label: "Owes fines", count: counts.owing },
              ]}
            />
          </div>

          {data.members.length === 0 ? (
            <EmptyState title="No members yet" action={<Button onClick={() => setEditing("new")}>Add a member</Button>}>
              Add people to the library before checking out books to them.
            </EmptyState>
          ) : members.length === 0 ? (
            <EmptyState title="No members match">Try another name, email or filter.</EmptyState>
          ) : (
            <Table label="Members">
              <THead>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Books out</Th>
                <Th className="text-right">Unpaid fines</Th>
                <Th>Joined</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <TBody>
                {members.map((member) => {
                  const out = booksOut.get(member.id) ?? 0;
                  const owes = Number(member.unpaid_fines_total) > 0;
                  return (
                    <tr key={member.id} className="hover:bg-paper/60">
                      <Td>
                        <Link href={`/admin/members/${member.id}`} className="font-semibold hover:text-stamp hover:underline">
                          {fullName(member)}
                        </Link>
                        <p className="text-sm text-ink-soft">{member.email}</p>
                      </Td>
                      <Td>
                        <span className="flex flex-wrap gap-1.5">
                          <MemberStatusBadge status={member.status} />
                          {member.role === "ADMIN" && <RoleBadge role={member.role} />}
                        </span>
                      </Td>
                      <Td className={`tabular-nums ${out === 0 ? "text-ink-faint" : ""}`}>{out}</Td>
                      <Td className={`text-right tabular-nums ${owes ? "font-semibold text-overdue" : "text-ink-soft"}`}>
                        {formatMoney(member.unpaid_fines_total)}
                      </Td>
                      <Td className="text-sm text-ink-soft tabular-nums">{formatDate(member.created_at)}</Td>
                      <Td className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(member)}>
                          Edit
                        </Button>
                        <Button variant="ghost-danger" size="sm" onClick={() => setRemoving(member)}>
                          Remove
                        </Button>
                      </Td>
                    </tr>
                  );
                })}
              </TBody>
            </Table>
          )}

          <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add a member" : "Edit member"}>
            {editing !== null && (
              <MemberForm
                member={editing === "new" ? undefined : editing}
                token={token}
                onCancel={() => setEditing(null)}
                onSaved={(saved) => {
                  toast(editing === "new" ? `Added ${fullName(saved)}` : `Saved ${fullName(saved)}`);
                  setEditing(null);
                  reload();
                }}
              />
            )}
          </Dialog>

          <ConfirmDialog
            open={removing !== null}
            onClose={() => setRemoving(null)}
            title={`Remove ${removing ? fullName(removing) : "member"}?`}
            confirmLabel="Remove member"
            onConfirm={async () => {
              if (!removing) return;
              await deleteMember(removing.id, token);
              toast(`Removed ${fullName(removing)}`);
              reload();
            }}
          >
            Their account is deleted. Members with books out, or with past loans or fines on record, can&apos;t be removed. Suspend them instead.
          </ConfirmDialog>
        </>
      )}
    </>
  );
}
