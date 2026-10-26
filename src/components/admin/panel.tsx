import { useId } from "react";

// The white card every dashboard list sits in, so headings, padding and
// empty states line up from one card to the next.
export function Panel({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="border-navy-light bg-surface flex min-w-0 flex-col rounded-2xl border"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5 pb-2 sm:px-6">
        <h2 id={headingId} className="text-navy font-semibold">
          {title}
        </h2>
        {aside && <p className="text-muted text-sm">{aside}</p>}
      </div>
      {children}
    </section>
  );
}

export function PanelEmpty({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pt-4 pb-10 text-center">
      <p className="text-foreground font-medium">{title}</p>
      <p className="text-muted mt-1 max-w-xs text-sm">{children}</p>
    </div>
  );
}
