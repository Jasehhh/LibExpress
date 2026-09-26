export interface Fine {
  id: string;
  loan_id: string;
  member_id: string;
  amount: string; // NUMERIC, sent as a string like "20.00"
  payment_status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
}

export type PaymentStatus = "PAID" | "UNPAID";

export interface PatchFineDTO {
  payment_status: PaymentStatus;
}
