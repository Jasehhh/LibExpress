"use client";

import { useState } from "react";

import { INPUT_CLASS } from "~/components/ui/form-field";
import { type AuthorChoice } from "~/lib/types";
import { api } from "~/trpc/react";

const MAX_SUGGESTIONS = 6;

const fullName = (author: AuthorChoice) =>
  `${author.firstName} ${author.lastName}`;

const normalize = (name: string) =>
  name.trim().replace(/\s+/g, " ").toLowerCase();

const keyOf = (author: AuthorChoice) =>
  author.id ?? `new:${normalize(fullName(author))}`;

// "Ursula K. Le Guin" -> first "Ursula K. Le", last "Guin". A new author
// needs both parts.
const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  const lastName = parts.pop() ?? "";
  return { firstName: parts.join(" "), lastName };
};

export function AuthorPicker({
  id,
  selected,
  onChange,
  error,
}: {
  id: string;
  selected: AuthorChoice[];
  onChange: (authors: AuthorChoice[]) => void;
  error?: string;
}) {
  const [authors] = api.author.getAll.useSuspenseQuery();
  const [query, setQuery] = useState("");

  const chosen = new Set(selected.map(keyOf));
  const needle = normalize(query);
  const matches = needle
    ? authors
        .filter(
          (author) =>
            !chosen.has(author.id) &&
            normalize(fullName(author)).includes(needle),
        )
        .slice(0, MAX_SUGGESTIONS)
    : [];
  const exists = [...authors, ...selected].some(
    (author) => normalize(fullName(author)) === needle,
  );
  const newName = splitName(query);
  const canCreate = !exists && !!newName.firstName && !!newName.lastName;

  const add = (author: AuthorChoice) => {
    onChange([...selected, author]);
    setQuery("");
  };

  return (
    <div className="relative">
      <div
        className={`${INPUT_CLASS} flex min-h-10 flex-wrap items-center gap-1.5 px-2 py-1.5 focus-within:ring-2 ${
          error
            ? "border-danger focus-within:ring-danger/20"
            : "focus-within:border-primary-light focus-within:ring-primary-light/30"
        }`}
      >
        {selected.map((author) => (
          <span
            key={keyOf(author)}
            className="bg-navy-light text-navy flex items-center gap-1 rounded-md py-0.5 pr-1 pl-2 text-sm"
          >
            {fullName(author)}
            {!author.id && <span className="text-xs opacity-70">(new)</span>}
            <button
              type="button"
              onClick={() =>
                onChange(
                  selected.filter((other) => keyOf(other) !== keyOf(author)),
                )
              }
              aria-label={`Remove ${fullName(author)}`}
              className="hover:bg-navy/10 flex size-5 items-center justify-center rounded"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
              >
                <path d="M7 7l10 10M17 7 7 17" />
              </svg>
            </button>
          </span>
        ))}
        <input
          id={id}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            // Enter picks an author instead of submitting the whole form.
            event.preventDefault();
            if (matches[0]) add(matches[0]);
            else if (canCreate) add(newName);
          }}
          placeholder={selected.length ? "Add another" : "Search authors"}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          className="h-7 min-w-32 flex-1 bg-transparent px-1 text-sm outline-none"
        />
      </div>

      {needle && (matches.length > 0 || canCreate) && (
        <ul className="border-border bg-surface absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-lg border py-1 shadow-[0_12px_32px_-8px_rgba(24,36,66,0.3)]">
          {matches.map((author) => (
            <li key={author.id}>
              <button
                type="button"
                onClick={() => add(author)}
                className="hover:bg-surface-muted focus-visible:bg-surface-muted w-full px-3 py-2 text-left text-sm outline-none"
              >
                {fullName(author)}
              </button>
            </li>
          ))}
          {canCreate && (
            <li className={matches.length ? "border-border border-t" : ""}>
              <button
                type="button"
                onClick={() => add(newName)}
                className="text-primary hover:bg-surface-muted focus-visible:bg-surface-muted w-full px-3 py-2 text-left text-sm font-medium outline-none"
              >
                {`Add “${newName.firstName} ${newName.lastName}” as a new author`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
