"use client";

import { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-[2.25rem] font-semibold leading-tight tracking-[-0.01em]">{title}</h1>
        {description && <p className="mt-1 max-w-prose text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function SearchBox({
  value,
  onChange,
  label,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden
      >
        <circle cx="8.5" cy="8.5" r="5.5" />
        <path d="M13 13l4 4" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-rule-strong bg-surface pl-9 pr-3 text-ink placeholder:text-ink-faint hover:border-ink-faint focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-stamp"
      />
    </div>
  );
}

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1 rounded-md border border-rule-strong bg-surface p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={`flex h-8 items-center gap-1.5 rounded px-3 text-sm font-semibold transition-colors ${
              active ? "bg-ink text-white" : "text-ink-soft hover:bg-paper hover:text-ink"
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`tabular-nums ${active ? "text-white/70" : "text-ink-faint"}`}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
