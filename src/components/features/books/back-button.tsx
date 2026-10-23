// A chevron and a label on a frosted pill, styled for the dark band. Shared by
// the page's link and the modal's button.
export const BACK_CLASS =
  "inline-flex items-center gap-1.5 rounded-full bg-white/10 py-1.5 pr-4 pl-2.5 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm transition hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none";

export function BackIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}
