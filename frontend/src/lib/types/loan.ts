export interface Loan {
  id: string;
  book_id: string;
  member_id: string;
  status: LoanStatus;
  checkout_date: Date;
  due_date: Date;
  return_date: Date | null;
}

type LoanStatus = "ACTIVE" | "RETURNED" | "OVERDUE";

export interface PostLoanDTO {
  book_id: string;
  member_id: string;
}

export type PatchLoanDTO = Partial<Loan>;
