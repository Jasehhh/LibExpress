import { ReactNode } from "react";
import { Button } from "./Button";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col gap-3 py-2" aria-label={label}>
      {[0, 1, 2, 3].map((row) => (
        <div key={row} className="flex items-center gap-4">
          <div className="h-4 w-1/3 animate-pulse rounded-sm bg-rule" />
          <div className="h-4 w-1/4 animate-pulse rounded-sm bg-rule" />
          <div className="h-4 flex-1 animate-pulse rounded-sm bg-rule/60" />
        </div>
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-overdue/30 bg-overdue-wash px-5 py-4">
      <p className="font-semibold text-overdue">Couldn&apos;t load this page</p>
      <p className="mt-1 text-[0.9375rem] text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-rule-strong px-6 py-10">
      <p className="font-serif text-xl font-semibold">{title}</p>
      {children && <div className="max-w-prose text-[0.9375rem] text-ink-soft">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
