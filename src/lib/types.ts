import { type RouterInputs, type RouterOutputs } from "~/trpc/react";


// The frontend's names for what the tRPC routers return and take. They are
// inferred from the routers, so they can't drift from the API.

export type Author = RouterOutputs["author"]["getAll"][number];
export type PostAuthorDTO = RouterInputs["author"]["create"];
export type PatchAuthorDTO = RouterInputs["author"]["update"]["data"];

// Every book procedure returns its authors and the copies on the shelf.
export type Book = RouterOutputs["book"]["getAll"][number];
export type BookGenre = Book["genre"];
export type PostBookDTO = RouterInputs["book"]["create"];
export type PatchBookDTO = RouterInputs["book"]["update"]["data"];

export type Member = RouterOutputs["member"]["getAll"][number];
export type MemberStatus = Member["status"];
export type PostMemberDTO = RouterInputs["member"]["create"];
export type PatchMemberDTO = RouterInputs["member"]["update"]["data"];

export type Loan = RouterOutputs["loan"]["getAll"][number];
export type LoanStatus = Loan["status"];
export type PostLoanDTO = RouterInputs["loan"]["create"];
export type ReturnLoanDTO = RouterInputs["loan"]["return"];
export type ReturnLoanResult = RouterOutputs["loan"]["return"];

export type Fine = RouterOutputs["fine"]["getAll"][number];
export type PaymentStatus = Fine["paymentStatus"];
export type PatchFineDTO = RouterInputs["fine"]["update"];

export type ActivityPage = RouterOutputs["activity"]["list"];
export type ActivityLog = ActivityPage["data"][number];
export type ActivityQuery = RouterInputs["activity"]["list"];

// CREATE has after, DELETE has before, UPDATE has both (changed fields only).
// Entries from the old nightly overdue job (adminId null) have loan_ids.
export interface ActivityDetails {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  loan_ids?: string[];
}
