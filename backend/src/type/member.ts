export interface Member {
  id: number;
  email: string;
  full_name: string;
  role: MemberRole;
  status: MemberStatus;
  active_loans_count: number; // max of 5
  unpaid_fines_total: number;
  created_at: Date;
}

type MemberRole = "USER" | "ADMIN";
type MemberStatus = "ACTIVE" | "SUSPENDED";
