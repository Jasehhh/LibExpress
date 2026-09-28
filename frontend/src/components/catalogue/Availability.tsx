import { plural } from "@/lib/format";

export function availabilityText(available: number, total: number) {
  if (total === 0) return "Not on the shelves yet";
  if (available === 0) return "All copies are on loan";
  return `${available} of ${plural(total, "copy", "copies")} on the shelf`;
}

export function AvailabilityLine({ available, total }: { available: number; total: number }) {
  const tone = total === 0 ? "bg-ink-faint" : available === 0 ? "bg-overdue" : "bg-shelf";
  return (
    <p className="flex items-center gap-2 text-sm text-ink-soft">
      <span className={`size-2 shrink-0 rounded-full ${tone}`} aria-hidden />
      {availabilityText(available, total)}
    </p>
  );
}
