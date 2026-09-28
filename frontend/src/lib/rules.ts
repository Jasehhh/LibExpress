// Library rules enforced by the backend (backend/src/routes/loanRoutes.ts).
// The frontend uses them for hints and previews only; the API decides.
export const MAX_ACTIVE_LOANS = 5;
export const LOAN_PERIOD_DAYS = 14;
export const FINE_PER_DAY = 20;

const DAY_MS = 1000 * 60 * 60 * 24;

// Same formula the backend uses when a loan is returned after its due date.
export function daysLate(dueDate: string, returnDate: Date): number {
  const late = returnDate.getTime() - new Date(dueDate).getTime();
  return late > 0 ? Math.ceil(late / DAY_MS) : 0;
}

export function daysUntil(date: string, now: number): number {
  return Math.ceil((new Date(date).getTime() - now) / DAY_MS);
}
