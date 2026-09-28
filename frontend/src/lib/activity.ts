import { formatMoney, fullName, plural } from "@/lib/format";
import { ActivityLog } from "@/lib/types/activity";
import { Book } from "@/lib/types/book";
import { Loan } from "@/lib/types/loan";
import { Member } from "@/lib/types/member";

type Row = Record<string, unknown>;

interface Lookups {
  books?: Map<string, Book>;
  members?: Map<string, Member>;
  loans?: Map<string, Loan>;
}

function str(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function personName(row: Row | undefined) {
  if (!row) return undefined;
  const first = str(row.first_name);
  const last = str(row.last_name);
  return first || last ? [first, last].filter(Boolean).join(" ") : undefined;
}

function bookTitle(row: { book_id?: unknown } | undefined, lookups: Lookups) {
  const id = str(row?.book_id);
  const book = id ? lookups.books?.get(id) : undefined;
  return book ? `“${book.title}”` : "a book";
}

function memberName(row: Row | undefined, lookups: Lookups) {
  const id = str(row?.member_id);
  const member = id ? lookups.members?.get(id) : undefined;
  return member ? fullName(member) : "a member";
}

export function actorName(log: ActivityLog) {
  if (log.admin_id === null) return "System";
  return log.admin_email ?? "Deleted staff account";
}

// One plain sentence per log entry, e.g. "added the book “Dune”".
export function describeActivity(log: ActivityLog, lookups: Lookups = {}): string {
  const before = log.details?.before as Row | undefined;
  const after = log.details?.after as Row | undefined;
  const row = after ?? before;

  if (log.admin_id === null && log.details?.loan_ids) {
    return `marked ${plural(log.details.loan_ids.length, "loan")} as overdue`;
  }

  switch (log.entity) {
    case "book": {
      const current = log.entity_id ? lookups.books?.get(log.entity_id) : undefined;
      const title = str(row?.title) ?? current?.title;
      const name = title ? `the book “${title}”` : "a book";
      if (log.action === "CREATE") return `added ${name}`;
      if (log.action === "DELETE") return `removed ${name}`;
      return `edited ${title ? `“${title}”` : "a book"}${changedFields(before, after)}`;
    }
    case "author": {
      const name = personName(row);
      const label = name ? `the author ${name}` : "an author";
      if (log.action === "CREATE") return `added ${label}`;
      if (log.action === "DELETE") return `removed ${label}`;
      return `edited ${label}${changedFields(before, after)}`;
    }
    case "member": {
      const current = log.entity_id ? lookups.members?.get(log.entity_id) : undefined;
      const name = (current && log.action === "UPDATE" ? fullName(current) : undefined) ?? personName(row);
      const label = name ? `the member ${name}` : "a member";
      if (log.action === "CREATE") return `added ${label}`;
      if (log.action === "DELETE") return `removed ${label}`;
      if (after?.status === "SUSPENDED") return `suspended ${name ?? "a member"}`;
      if (after?.status === "ACTIVE" && before?.status === "SUSPENDED") return `reinstated ${name ?? "a member"}`;
      return `edited ${label}${changedFields(before, after)}`;
    }
    case "loan": {
      if (log.action === "CREATE") {
        return `checked out ${bookTitle(after, lookups)} to ${memberName(after, lookups)}`;
      }
      if (after?.status === "RETURNED") {
        const loan = log.entity_id ? lookups.loans?.get(log.entity_id) : undefined;
        return `recorded the return of ${bookTitle(loan, lookups)}`;
      }
      return `updated a loan${changedFields(before, after)}`;
    }
    case "fine": {
      if (log.action === "CREATE") {
        const amount = str(after?.amount);
        return amount ? `added a late fine of ${formatMoney(amount)}` : "added a late fine";
      }
      if (after?.payment_status === "PAID") return "marked a fine as paid";
      if (after?.payment_status === "UNPAID") return "marked a fine as unpaid";
      return "updated a fine";
    }
    default:
      return `${log.action.toLowerCase()}d a ${log.entity}`;
  }
}

function changedFields(before?: Row, after?: Row) {
  const keys = Object.keys(after ?? before ?? {});
  if (keys.length === 0) return "";
  return ` (${keys.map((key) => key.replace(/_/g, " ")).join(", ")})`;
}
