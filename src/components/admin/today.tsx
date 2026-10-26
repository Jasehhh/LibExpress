"use client";

const longDate = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

// Rendered in the browser's time zone, which can differ from the server's.
export function Today() {
  return <span suppressHydrationWarning>{longDate.format(new Date())}</span>;
}
