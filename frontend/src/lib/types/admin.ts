export interface admin {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

// Payload of the JWT from /auth/login and /auth/register.
export interface AdminToken {
  id: string;
  email: string;
  iat: number;
  exp: number;
}
