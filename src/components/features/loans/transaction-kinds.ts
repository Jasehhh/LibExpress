import { type PillTone } from "~/components/ui/pill";
import { startOfDay } from "~/lib/time";
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

// The history list loads recent desk activity only, so it stays fast as
// loans pile up. The sales report's "All time" still covers everything.
export const HISTORY_DAYS = 90;
export const historySince = () => startOfDay(new Date(), 1 - HISTORY_DAYS);
