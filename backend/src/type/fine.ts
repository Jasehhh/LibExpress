export interface Fine {
  id: number;
  loan_id: number;
  member_id: number;
  amount: number;
  payment_status: PaymentStatus;
  created_at: Date;
}

type PaymentStatus = "PAID" | "UNPAID";
