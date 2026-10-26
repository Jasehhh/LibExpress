import { type RouterInputs, type RouterOutputs } from "~/trpc/react";

export type Author = RouterOutputs["author"]["getAll"][number];
export type AuthorChoice = {
  id?: string;
  firstName: string;
  lastName: string;
};

export type Book = RouterOutputs["book"]["getAll"][number];
export type BookGenre = Book["genre"];
export type PostBookDTO = RouterInputs["book"]["create"];
export type PatchBookDTO = RouterInputs["book"]["update"]["data"];

export type Member = RouterOutputs["member"]["getAll"][number];
export type MemberStatus = Member["status"];
export type PostMemberDTO = RouterInputs["member"]["create"];
export type PatchMemberDTO = RouterInputs["member"]["update"]["data"];

export type PostLoanDTO = RouterInputs["loan"]["create"];
export type ReturnLoanDTO = RouterInputs["loan"]["return"];
export type ReturnLoanResult = RouterOutputs["loan"]["return"];
export type OpenLoan = RouterOutputs["loan"]["getOpen"][number];
export type MemberLoan = RouterOutputs["loan"]["getHistory"][number];
export type Transaction = RouterOutputs["loan"]["getTransactions"][number];

export type PatchFineDTO = RouterInputs["fine"]["update"];

export type ActivityItem =
  RouterOutputs["dashboard"]["get"]["activity"][number];
