export type ActivityAction = "CREATE" | "UPDATE" | "DELETE";
export type ActivityEntity = "book" | "member" | "loan" | "fine" | "author";

// CREATE has after, DELETE has before, UPDATE has both (changed fields only).
// The nightly overdue job (admin_id null) has loan_ids.
export interface ActivityDetails {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  loan_ids?: string[];
}

export interface ActivityLog {
  id: string;
  admin_id: string | null; // null = System
  admin_email: string | null;
  action: ActivityAction;
  entity: ActivityEntity;
  entity_id: string | null;
  details: ActivityDetails | null;
  created_at: string;
}

export interface ActivityQuery {
  entity?: ActivityEntity;
  entity_id?: string;
  admin_id?: string;
  limit?: number; // 1-200, default 50
  offset?: number; // default 0
}

export interface ActivityPage {
  data: ActivityLog[];
  total: number;
}
