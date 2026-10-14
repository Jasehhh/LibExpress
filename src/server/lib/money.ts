import { type Prisma } from "../../../generated/prisma";

import { paymentStatus } from "./derived";

// superjson can't carry Prisma's Decimal to the client, so money goes out as
// a string like "20.00", the same as the old API.

// Fines are read with their loan's member, which is who owes them.
export const FINE_INCLUDE = {
  loan: { select: { memberId: true } },
} satisfies Prisma.FineInclude;

type FineWithMember = Prisma.FineGetPayload<{ include: typeof FINE_INCLUDE }>;

export const serializeFine = ({ loan, ...fine }: FineWithMember) => ({
  ...fine,
  memberId: loan.memberId,
  amount: fine.amount.toFixed(2),
  paymentStatus: paymentStatus(fine),
});
