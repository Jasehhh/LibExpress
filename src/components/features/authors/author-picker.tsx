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

// Picks from the author list only. New authors are added under Authors on
// the catalog page first, so every book points at a checked author.
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

  const chosen = new Set(selected.map((author) => author.id));
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

  const add = (author: AuthorChoice) => {
    onChange([
      ...selected,
      { id: author.id, firstName: author.firstName, lastName: author.lastName },
    ]);
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
            key={author.id}
            className="bg-navy-light text-navy flex items-center gap-1 rounded-md py-0.5 pr-1 pl-2 text-sm"
          >
            {fullName(author)}
            <button
              type="button"
              onClick={() =>
                onChange(selected.filter((other) => other.id !== author.id))
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
          }}
          placeholder={selected.length ? "Add another" : "Search authors"}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
          className="h-7 min-w-32 flex-1 bg-transparent px-1 text-sm outline-none"
        />
      </div>

      {needle && (
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
          {matches.length === 0 && (
            <li className="text-muted px-3 py-2 text-sm">
              {`No author matches “${query.trim()}”. Add them under Authors first.`}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
