import { Loan } from "@/lib/types/loan";

export function byId<T extends { id: string }>(items: T[] | undefined) {
  return new Map((items ?? []).map((item) => [item.id, item]));
}

// ACTIVE and OVERDUE loans still have the book out.
export function isOpen(loan: Loan) {
  return loan.status !== "RETURNED";
}

// OVERDUE is set by the nightly job; an ACTIVE loan can be past due before
// the job runs.
export function isLate(loan: Loan, now: number) {
  if (loan.status === "OVERDUE") return true;
  return loan.status === "ACTIVE" && new Date(loan.due_date).getTime() < now;
}

// The backend's 5-loan limit counts only ACTIVE loans.
export function activeLoanCounts(loans: Loan[] | undefined) {
  const counts = new Map<string, number>();
  for (const loan of loans ?? []) {
    if (loan.status === "ACTIVE") {
      counts.set(loan.member_id, (counts.get(loan.member_id) ?? 0) + 1);
    }
  }
  return counts;
}

// Books a member still has out (ACTIVE or OVERDUE).
export function openLoanCounts(loans: Loan[] | undefined) {
  const counts = new Map<string, number>();
  for (const loan of loans ?? []) {
    if (isOpen(loan)) {
      counts.set(loan.member_id, (counts.get(loan.member_id) ?? 0) + 1);
    }
  }
  return counts;
}

export function byDueDate(a: Loan, b: Loan) {
  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
}
