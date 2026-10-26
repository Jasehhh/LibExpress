import { type PillTone } from "~/components/ui/pill";
import { type Transaction } from "~/lib/types";

// How each desk transaction is named and coloured, wherever it is listed.
export const TRANSACTION_KINDS: Record<
  Transaction["kind"],
  { label: string; tone: PillTone }
> = {
  checkout: { label: "Checkout", tone: "info" },
  return: { label: "Return", tone: "good" },
  fine: { label: "Late fine", tone: "bad" },
  paid: { label: "Fine paid", tone: "good" },
};
