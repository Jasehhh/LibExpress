"use client";

import { useId, useState } from "react";

import { INPUT_CLASS } from "~/components/ui/form-field";

const MAX_MATCHES = 6;

// Type to search, pick one with a click or the arrow keys and Enter. Once
// picked, the choice shows as a card with a button to change it.
export function Combobox<T>({
  id,
  placeholder,
  items,
  itemKey,
  searchText,
  renderItem,
  selected,
  onSelect,
  noMatches,
  icon,
}: {
  id: string;
  placeholder: string;
  items: T[];
  itemKey: (item: T) => string;
  searchText: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  selected: T | null;
  onSelect: (item: T | null) => void;
  noMatches: string;
  icon: React.ReactNode;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  if (selected) {
    return (
      <div className="border-navy-light bg-surface flex items-center gap-2 rounded-lg border py-2 pr-2 pl-3">
        <div className="min-w-0 flex-1">{renderItem(selected)}</div>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQuery("");
          }}
          aria-label="Clear and pick another"
          title="Clear and pick another"
          className="text-muted hover:bg-surface-muted hover:text-navy focus-visible:ring-primary-light flex size-8 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.25}
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
    );
  }

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? items
        .filter((item) => searchText(item).toLowerCase().includes(needle))
        .slice(0, MAX_MATCHES)
    : [];
  const open = needle.length > 0;
  const pick = (item: T | undefined) => {
    if (!item) return;
    onSelect(item);
    setQuery("");
    setActive(0);
  };

  return (
    <div className="relative">
      <span
        aria-hidden
        className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
      >
        {icon}
      </span>
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={
          open && matches[active] ? `${listId}-${active}` : undefined
        }
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            pick(matches[active]);
          } else if (event.key === "Escape") {
            setQuery("");
          }
        }}
        placeholder={placeholder}
        className={`${INPUT_CLASS} h-11 pl-10`}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="border-border bg-surface absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border py-1 shadow-[0_12px_32px_-8px_rgba(24,36,66,0.3)]"
        >
          {matches.length > 0 ? (
            matches.map((item, i) => (
              <li
                key={itemKey(item)}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(event) => {
                  // Keep focus in the input until the pick lands.
                  event.preventDefault();
                  pick(item);
                }}
                className={`cursor-pointer px-3 py-2 ${i === active ? "bg-surface-muted" : ""}`}
              >
                {renderItem(item)}
              </li>
            ))
          ) : (
            <li className="text-muted px-3 py-2 text-sm">{noMatches}</li>
          )}
        </ul>
      )}
    </div>
  );
}
