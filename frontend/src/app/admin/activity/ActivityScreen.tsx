"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { fetchActivity } from "@/app/api/activityService";
import { fetchBooks } from "@/app/api/bookService";
import { fetchLoans } from "@/app/api/loanService";
import { fetchMembers } from "@/app/api/memberService";
import { useStaff } from "@/components/admin/StaffShell";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { actorName, describeActivity } from "@/lib/activity";
import { formatDateTime, relativeTime } from "@/lib/format";
import { byId } from "@/lib/loans";
import { useNow } from "@/lib/useNow";
import { useQuery } from "@/lib/useQuery";
import { ActivityAction, ActivityDetails, ActivityEntity, ActivityLog } from "@/lib/types/activity";

const PAGE_SIZE = 50;

const ENTITIES: { value: ActivityEntity; label: string }[] = [
  { value: "loan", label: "Loans" },
  { value: "fine", label: "Fines" },
  { value: "book", label: "Books" },
  { value: "author", label: "Authors" },
  { value: "member", label: "Members" },
];

// Marker color by action; the sentence itself says what happened.
const ACTION_MARK: Record<ActivityAction, string> = {
  CREATE: "bg-shelf",
  UPDATE: "bg-stamp",
  DELETE: "bg-overdue",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ActivityScreen() {
  const { token, admin } = useStaff();
  const now = useNow();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  // Filters live in the URL so links like "this member's history" work.
  const entityParam = params.get("entity");
  const entity = ENTITIES.some((e) => e.value === entityParam) ? (entityParam as ActivityEntity) : undefined;
  const entityIdParam = params.get("entity_id");
  const entityId = entityIdParam && UUID.test(entityIdParam) ? entityIdParam : undefined;
  const mine = params.get("mine") === "1" && admin !== null;
  const page = Math.max(Number(params.get("page")) || 1, 1);

  const setParams = useCallback(
    (changes: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (!("page" in changes)) next.delete("page");
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const adminId = mine ? admin?.id : undefined;
  const load = useCallback(
    () =>
      fetchActivity(
        { entity, entity_id: entityId, admin_id: adminId, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
        token,
      ),
    [entity, entityId, adminId, page, token],
  );
  const { data, error, loading, reload } = useQuery(load);

  // Names for loans and members in the sentences; the log only stores ids.
  const loadLookups = useCallback(
    () => Promise.all([fetchBooks(), fetchMembers(token), fetchLoans(token)]),
    [token],
  );
  const { data: lookupData } = useQuery(loadLookups);
  const lookups = useMemo(
    () => ({ books: byId(lookupData?.[0]), members: byId(lookupData?.[1]), loans: byId(lookupData?.[2]) }),
    [lookupData],
  );

  const total = data?.total ?? 0;
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

  return (
    <>
      <PageHeader title="Activity log" description="Every change staff make is recorded here, newest first. Entries can't be edited." />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <select
          value={entity ?? ""}
          onChange={(event) => setParams({ entity: event.target.value || undefined, entity_id: undefined })}
          aria-label="Filter by record type"
          className="h-10 rounded-md border border-rule-strong bg-surface px-3 hover:border-ink-faint"
        >
          <option value="">All records</option>
          {ENTITIES.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
        <label className="flex h-10 items-center gap-2 rounded-md border border-rule-strong bg-surface px-3 text-[0.9375rem]">
          <input
            type="checkbox"
            checked={mine}
            onChange={(event) => setParams({ mine: event.target.checked ? "1" : undefined })}
            className="size-4 accent-stamp"
          />
          Only my changes
        </label>
        {entityId && (
          <p className="flex items-center gap-2 text-[0.9375rem] text-ink-soft">
            Showing the history of one {entity ?? "record"}.
            <button
              type="button"
              onClick={() => setParams({ entity_id: undefined })}
              className="font-semibold text-stamp hover:underline"
            >
              Show all
            </button>
          </p>
        )}
      </div>

      {error && !data && <ErrorState message={error.message} onRetry={reload} />}
      {!data && !error && <LoadingState label="Loading activity" />}

      {data && (
        <div className={loading ? "opacity-60 transition-opacity" : undefined} aria-busy={loading}>
          {data.data.length === 0 ? (
            <EmptyState title="No changes match">
              {entity || mine || entityId
                ? "Nothing has been recorded for these filters yet."
                : "Changes appear here as staff add books, record loans and update members."}
            </EmptyState>
          ) : (
            <ol className="divide-y divide-rule overflow-hidden rounded-md border border-rule bg-surface">
              {data.data.map((log) => (
                <Entry key={log.id} log={log} now={now} lookups={lookups} onShowHistory={setParams} />
              ))}
            </ol>
          )}

          {total > 0 && (
            <nav aria-label="Pages" className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm tabular-nums text-ink-soft">
                {first}–{last} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setParams({ page: page > 2 ? String(page - 1) : undefined })}
                >
                  Newer
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={last >= total}
                  onClick={() => setParams({ page: String(page + 1) })}
                >
                  Older
                </Button>
              </div>
            </nav>
          )}
        </div>
      )}
    </>
  );
}

function Entry({
  log,
  now,
  lookups,
  onShowHistory,
}: {
  log: ActivityLog;
  now: number;
  lookups: Parameters<typeof describeActivity>[1];
  onShowHistory: (changes: Record<string, string | undefined>) => void;
}) {
  const hasDetails = Boolean(log.details?.before || log.details?.after);
  return (
    <li className="grid gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[9.5rem_1fr]">
      <div className="text-sm text-ink-soft">
        <time dateTime={log.created_at} title={formatDateTime(log.created_at)}>
          {relativeTime(log.created_at, now)}
        </time>
        <span className="block text-xs text-ink-faint tabular-nums">{formatDateTime(log.created_at)}</span>
      </div>
      <div className="min-w-0">
        <p className="leading-snug">
          <span className={`mr-2 inline-block size-2 -translate-y-px rounded-full ${ACTION_MARK[log.action]}`} aria-hidden />
          <span className="font-semibold">{actorName(log)}</span> {describeActivity(log, lookups)}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {log.entity_id && (
            <button
              type="button"
              onClick={() => onShowHistory({ entity: log.entity, entity_id: log.entity_id ?? undefined })}
              className="font-semibold text-stamp hover:underline"
            >
              History of this {log.entity}
            </button>
          )}
        </div>
        {hasDetails && log.details && (
          <details className="group mt-2">
            <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">
              {log.action === "UPDATE" ? "What changed" : "Recorded values"}
            </summary>
            <Changes details={log.details} />
          </details>
        )}
      </div>
    </li>
  );
}

const DATE_LIKE = /^\d{4}-\d{2}-\d{2}T/;

function show(value: unknown) {
  if (value === null || value === undefined || value === "") return <span className="text-ink-faint">empty</span>;
  if (typeof value === "string" && DATE_LIKE.test(value)) return formatDateTime(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Changes({ details }: { details: ActivityDetails }) {
  const { before, after } = details;
  const keys = Object.keys(after ?? before ?? {});
  const both = Boolean(before && after);
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="w-full min-w-[28rem] text-sm">
        <thead className="text-left text-ink-soft">
          <tr className="border-b border-rule">
            <th scope="col" className="py-1.5 pr-4 font-semibold">
              Field
            </th>
            {both ? (
              <>
                <th scope="col" className="py-1.5 pr-4 font-semibold">
                  Before
                </th>
                <th scope="col" className="py-1.5 font-semibold">
                  After
                </th>
              </>
            ) : (
              <th scope="col" className="py-1.5 font-semibold">
                Value
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {keys.map((key) => (
            <tr key={key}>
              <th scope="row" className="py-1.5 pr-4 text-left font-normal text-ink-soft">
                {key.replace(/_/g, " ")}
              </th>
              {both ? (
                <>
                  <td className="py-1.5 pr-4 break-all text-ink-soft line-through decoration-overdue/50">{show(before?.[key])}</td>
                  <td className="py-1.5 break-all">{show(after?.[key])}</td>
                </>
              ) : (
                <td className="py-1.5 break-all">{show((after ?? before)?.[key])}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
