"use client";

import { ReactNode, useId, useState } from "react";

export interface PickerItem {
  id: string;
  title: string;
  detail?: string;
  note?: ReactNode;
  disabled?: boolean;
  search: string;
}

// Filterable radio list: type to narrow, arrow keys to move, space to pick.
export function SearchPicker({
  label,
  items,
  value,
  onChange,
  placeholder,
  emptyText,
  error,
}: {
  label: string;
  items: PickerItem[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  emptyText: string;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const id = useId();
  const needle = query.trim().toLowerCase();
  const matches = needle ? items.filter((item) => item.search.includes(needle)) : items;

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label={`Search ${label.toLowerCase()}`}
        className="h-10 w-full rounded-md border border-rule-strong bg-surface px-3 placeholder:text-ink-faint hover:border-ink-faint focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-stamp"
      />
      <div
        className={`max-h-52 overflow-y-auto rounded-md border bg-surface ${error ? "border-overdue" : "border-rule"}`}
      >
        {matches.length === 0 ? (
          <p className="px-3 py-4 text-sm text-ink-soft">{emptyText}</p>
        ) : (
          <ul className="divide-y divide-rule">
            {matches.map((item) => {
              const checked = item.id === value;
              return (
                <li key={item.id}>
                  <label
                    className={`flex items-start gap-3 px-3 py-2.5 ${
                      item.disabled
                        ? "cursor-not-allowed opacity-55"
                        : checked
                          ? "cursor-pointer bg-stamp-wash"
                          : "cursor-pointer hover:bg-paper"
                    }`}
                  >
                    <input
                      type="radio"
                      name={id}
                      value={item.id}
                      checked={checked}
                      disabled={item.disabled}
                      onChange={() => onChange(item.id)}
                      className="mt-1 accent-stamp"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug">{item.title}</span>
                      {item.detail && <span className="block truncate text-sm text-ink-soft">{item.detail}</span>}
                    </span>
                    {item.note && <span className="shrink-0 text-sm">{item.note}</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && <p className="text-sm text-overdue">{error}</p>}
    </fieldset>
  );
}
