export interface Member {
  id: number;
  full_name: string;
  status: MemberStatus;
  active_loans_count: number; // max of 5
  unpaid_fines_total: number;
}

type MemberStatus = "ACTIVE" | "SUSPENDED";
