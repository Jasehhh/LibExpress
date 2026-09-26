import { Fine } from "./fine";

export interface Loan {
  id: string;
  book_id: string;
  member_id: string;
  status: LoanStatus;
  checkout_date: string;
  due_date: string;
  return_date: string | null;
}

export type LoanStatus = "ACTIVE" | "RETURNED" | "OVERDUE";

export interface PostLoanDTO {
  book_id: string;
  member_id: string;
}

export interface PatchLoanDTO {
  return_date: string;
}

// PATCH /loan/:id returns the returned loan and the fine if it was late.
export interface ReturnLoanResult {
  loan: Loan;
  fine: Fine | null;
}
