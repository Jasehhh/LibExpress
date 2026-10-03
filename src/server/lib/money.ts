import { type Prisma } from "../../../generated/prisma";

// superjson can't carry Prisma's Decimal to the client, so money goes out as
// a string like "20.00", the same as the old API.

export const serializeMember = <T extends { unpaidFinesTotal: Prisma.Decimal }>(
  member: T,
) => ({ ...member, unpaidFinesTotal: member.unpaidFinesTotal.toFixed(2) });

export const serializeFine = <T extends { amount: Prisma.Decimal }>(fine: T) => ({
  ...fine,
  amount: fine.amount.toFixed(2),
});
