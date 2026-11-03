import { type RouterOutputs } from "~/trpc/react";

export type Author = RouterOutputs["author"]["getAll"][number];
export type AuthorChoice = {
  id: string;
  firstName: string;
  lastName: string;
};

export type Book = RouterOutputs["book"]["getAll"][number];
export type BookGenre = Book["genre"];

export type Member = RouterOutputs["member"]["getAll"][number];
export type MemberStatus = Member["status"];

export type OpenLoan = RouterOutputs["loan"]["getOpen"][number];
export type MemberLoan = RouterOutputs["loan"]["getHistory"][number];
export type Transaction = RouterOutputs["loan"]["getTransactions"][number];

export type ActivityItem =
  RouterOutputs["dashboard"]["get"]["activity"][number];
