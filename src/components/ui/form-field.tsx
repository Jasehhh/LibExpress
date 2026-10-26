export const INPUT_CLASS =
  "border-border bg-surface placeholder:text-muted/70 focus:border-primary-light focus:ring-primary-light/30 aria-invalid:border-danger aria-invalid:focus:ring-danger/20 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2";

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="text-foreground mb-1.5 block text-sm font-medium"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-danger mt-1.5 text-sm">
          {error}
        </p>
      ) : (
        hint && <p className="text-muted mt-1.5 text-xs">{hint}</p>
      )}
    </div>
  );
}

export const BUTTON_CLASS = {
  primary:
    "bg-navy hover:bg-info focus-visible:ring-primary-light inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_0_rgba(0,0,0,0.25)] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60",
  secondary:
    "border-border text-foreground hover:bg-surface-muted focus-visible:ring-primary-light inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60",
  danger:
    "bg-danger focus-visible:ring-danger inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_0_rgba(0,0,0,0.25)] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60",
};
