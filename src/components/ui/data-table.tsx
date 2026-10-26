import Link from "next/link";

import { BUTTON_CLASS, INPUT_CLASS } from "~/components/ui/form-field";

// Shared pieces for the staff tables (catalog, members): the toolbar
// controls, row action buttons and the page footer.

export const TABLE_HEAD_CLASS = "bg-surface-muted/60 text-muted";

// The line under a page title: a summary on the left, the add button right.
export function TableIntro({
  summary,
  addLabel,
  onAdd,
}: {
  summary: React.ReactNode;
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-muted text-sm">{summary}</p>
      <button type="button" onClick={onAdd} className={BUTTON_CLASS.primary}>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        {addLabel}
      </button>
    </div>
  );
}

// The white card holding a toolbar, the table and its footer.
export function TableCard({
  label,
  toolbar,
  children,
}: {
  label: string;
  toolbar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="border-navy-light bg-surface mt-6 overflow-hidden rounded-2xl border"
    >
      <div className="border-border flex flex-wrap items-center gap-3 border-b p-4">
        {toolbar}
      </div>
      {children}
    </section>
  );
}

export function SearchInput({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative min-w-56 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${INPUT_CLASS} h-10 pl-9`}
      />
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (readonly [string, string])[];
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${INPUT_CLASS} h-10 w-auto pr-8`}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

export const ACTION_ICONS = {
  view: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />,
  delete: (
    <path d="M5 7h14M10 11v6M14 11v6M6.5 7l1 12.5h9L17.5 7M9.5 7V4.5h5V7" />
  ),
};

const ICON_BUTTON_CLASS =
  "text-muted focus-visible:ring-primary-light flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none";

function ActionIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${ICON_BUTTON_CLASS} ${
        danger
          ? "hover:bg-danger-light hover:text-danger"
          : "hover:bg-surface-muted hover:text-navy"
      }`}
    >
      <ActionIcon>{children}</ActionIcon>
    </button>
  );
}

export function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`${ICON_BUTTON_CLASS} hover:bg-surface-muted hover:text-navy`}
    >
      <ActionIcon>{children}</ActionIcon>
    </Link>
  );
}

// "Nothing here" inside a table card, with a way out when filters caused it.
export function TableEmpty({
  title,
  body,
  onClear,
}: {
  title: string;
  body?: string;
  onClear?: () => void;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-foreground font-medium">{title}</p>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          className="text-navy mt-3 text-sm font-semibold underline underline-offset-4 hover:no-underline"
        >
          Clear filters
        </button>
      ) : (
        body && <p className="text-muted mt-1 text-sm">{body}</p>
      )}
    </div>
  );
}

const count = new Intl.NumberFormat("en-PH");

export function Pagination({
  page,
  pageSize,
  shown,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  shown: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;

  return (
    <footer className="border-border text-muted flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-sm">
      <p className="tabular-nums">
        Showing {first}–{first + shown - 1} of {count.format(total)}
      </p>
      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center gap-2">
          <PageButton
            label="Previous page"
            disabled={page === 1}
            onClick={() => onPage(page - 1)}
          >
            <path d="m15 6-6 6 6 6" />
          </PageButton>
          <span className="text-foreground px-1 tabular-nums">
            Page {page} of {pages}
          </span>
          <PageButton
            label="Next page"
            disabled={page === pages}
            onClick={() => onPage(page + 1)}
          >
            <path d="m9 6 6 6-6 6" />
          </PageButton>
        </nav>
      )}
    </footer>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="border-border text-foreground hover:bg-surface-muted focus-visible:ring-primary-light flex size-9 items-center justify-center rounded-lg border transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
    >
      <ActionIcon>{children}</ActionIcon>
    </button>
  );
}
