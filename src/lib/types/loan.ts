export interface Loan {
  id: number;
  bookId: number;
  memberId: number;
  checkoutDate: Date;
  dueDate: Date;
  returnDate: Date;
  status: LoanStatus;
}

type LoanStatus = "ACTIVE" | "RETURNED" | "OVERDUE";
