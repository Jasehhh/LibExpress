export interface Member {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: MemberRole;
  status: MemberStatus;
  active_loans_count: number; // max of 5
  unpaid_fines_total: string; // NUMERIC, sent as a string like "20.00"
  created_at: string;
}

export type MemberRole = "USER" | "ADMIN";
export type MemberStatus = "ACTIVE" | "SUSPENDED";

export interface PostMemberDTO {
  email: string;
  first_name: string;
  last_name: string;
}

export type PatchMemberDTO = Partial<
  PostMemberDTO & { role: MemberRole; status: MemberStatus }
>;
