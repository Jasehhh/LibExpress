export interface Fine {
  id: number;
  loanId: number;
  memberId: number;
  amount: number;
  paymentStatus: PaymentStatus;
}

type PaymentStatus = "PAID" | "UNPAID";
