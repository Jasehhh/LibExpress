import {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useId,
} from "react";

const control =
  "w-full rounded-md border bg-surface px-3 text-ink placeholder:text-ink-faint transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-stamp";

function controlClass(error?: string) {
  return `${control} ${error ? "border-overdue" : "border-rule-strong hover:border-ink-faint"}`;
}

interface FieldShellProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, hint, error, children, className = "" }: FieldShellProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-overdue">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
}

export function TextField({
  label,
  hint,
  error,
  containerClassName,
  className = "",
  ...props
}: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={containerClassName}>
      <input
        id={id}
        className={`${controlClass(error)} h-10 ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
}

export function SelectField({
  label,
  hint,
  error,
  containerClassName,
  className = "",
  children,
  ...props
}: SelectFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={containerClassName}>
      <select
        id={id}
        className={`${controlClass(error)} h-10 ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
}

export function TextAreaField({
  label,
  hint,
  error,
  containerClassName,
  className = "",
  ...props
}: TextAreaFieldProps) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={containerClassName}>
      <textarea
        id={id}
        className={`${controlClass(error)} py-2 leading-relaxed ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        {...props}
      />
    </FieldShell>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md border border-overdue/30 bg-overdue-wash px-3 py-2 text-sm text-overdue">
      {message}
    </p>
  );
}
