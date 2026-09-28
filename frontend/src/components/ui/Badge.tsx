import { ReactNode } from "react";
import { LoanStatus } from "@/lib/types/loan";
import { PaymentStatus } from "@/lib/types/fine";
import { MemberRole, MemberStatus } from "@/lib/types/member";

export type Tone = "neutral" | "stamp" | "shelf" | "overdue" | "caution";

const tones: Record<Tone, string> = {
  neutral: "bg-paper text-ink-soft border-rule-strong",
  stamp: "bg-stamp-wash text-stamp-deep border-stamp/25",
  shelf: "bg-shelf-wash text-shelf border-shelf/25",
  overdue: "bg-overdue-wash text-overdue border-overdue/25",
  caution: "bg-caution-wash text-caution border-caution/25",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-sm border px-1.5 py-px text-[0.8125rem] font-semibold leading-5 whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

// "Past due" covers ACTIVE loans whose due date has passed but that the
// nightly job has not marked OVERDUE yet.
export function LoanStatusBadge({ status, pastDue }: { status: LoanStatus; pastDue?: boolean }) {
  if (status === "RETURNED") return <Badge tone="neutral">Returned</Badge>;
  if (status === "OVERDUE") return <Badge tone="overdue">Overdue</Badge>;
  if (pastDue) return <Badge tone="overdue">Past due</Badge>;
  return <Badge tone="stamp">On loan</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return status === "PAID" ? <Badge tone="shelf">Paid</Badge> : <Badge tone="overdue">Unpaid</Badge>;
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  return status === "ACTIVE" ? <Badge tone="shelf">Active</Badge> : <Badge tone="caution">Suspended</Badge>;
}

export function RoleBadge({ role }: { role: MemberRole }) {
  return role === "ADMIN" ? <Badge tone="stamp">Admin</Badge> : <Badge>User</Badge>;
}
