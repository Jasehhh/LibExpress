"use client";

import { TIME_ZONE } from "~/lib/time";

const longDate = new Intl.DateTimeFormat("en-PH", {
  timeZone: TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
});

export function Today() {
  return <span suppressHydrationWarning>{longDate.format(new Date())}</span>;
}
