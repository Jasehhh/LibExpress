import { type RouterInputs, type RouterOutputs } from "~/trpc/react";

export type Author = RouterOutputs["author"]["getAll"][number];
export type PostAuthorDTO = RouterInputs["author"]["create"];
export type PatchAuthorDTO = RouterInputs["author"]["update"]["data"];

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
export type OpenLoan = RouterOutputs["loan"]["getOpen"][number];
export type MemberLoan = RouterOutputs["loan"]["getHistory"][number];

export type Fine = RouterOutputs["fine"]["getAll"][number];
export type PaymentStatus = Fine["paymentStatus"];
export type PatchFineDTO = RouterInputs["fine"]["update"];

export type DashboardOverview = RouterOutputs["dashboard"]["overview"];
export type CirculationMonth =
  RouterOutputs["dashboard"]["circulation"][number];
export type PopularBook = RouterOutputs["dashboard"]["popularBooks"][number];
export type OverdueLoan = RouterOutputs["dashboard"]["overdueLoans"][number];
export type ActivityItem = RouterOutputs["dashboard"]["activity"][number];

export type ActivityPage = RouterOutputs["activity"]["list"];
export type ActivityLog = ActivityPage["data"][number];
export type ActivityQuery = RouterInputs["activity"]["list"];

export interface ActivityDetails {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  loan_ids?: string[];
}
