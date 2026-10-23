// A round white button with a back arrow, top left of the dark band. Shared by
// the page's link and the modal's button.
export const BACK_CLASS =
  "text-navy flex size-10 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-transform hover:-translate-x-0.5 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy focus-visible:outline-none motion-reduce:transition-none";

export function BackArrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}
