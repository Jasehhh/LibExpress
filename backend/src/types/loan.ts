export interface Loan {
  id: number;
  book_id: number;
  member_id: number;
  status: LoanStatus;
  checkout_date: Date;
  dueDate: Date;
  return_date: Date;
}

type LoanStatus = "ACTIVE" | "RETURNED" | "OVERDUE";
