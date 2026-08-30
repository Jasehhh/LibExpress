import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    export interface Request {
      admin?: string | JwtPayload;
    }
  }
}
