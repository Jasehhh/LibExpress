"use client";

import { useState } from "react";

import { INPUT_CLASS } from "~/components/ui/form-field";
import { type Author } from "~/lib/types";
import { api } from "~/trpc/react";

const MAX_SUGGESTIONS = 6;

const fullName = (author: Author) => `${author.firstName} ${author.lastName}`;

// "Ursula K. Le Guin" -> first "Ursula K. Le", last "Guin". Staff can fix an
// odd split later; a new author needs both parts.
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
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}) {
  const utils = api.useUtils();
  const [authors] = api.author.getAll.useSuspenseQuery();
  const [query, setQuery] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const create = api.author.create.useMutation({
    onSuccess: async (author) => {
      await utils.author.getAll.invalidate();
      onChange([...selected, author.id]);
      setQuery("");
    },
    onError: (err) => setCreateError(err.message),
  });

  const chosen = selected.flatMap((authorId) => {
    const author = authors.find((a) => a.id === authorId);
    return author ? [author] : [];
  });
  const needle = query.trim().toLowerCase();
  const matches = needle
    ? authors
        .filter(
          (author) =>
            !selected.includes(author.id) &&
            fullName(author).toLowerCase().includes(needle),
        )
        .slice(0, MAX_SUGGESTIONS)
    : [];
  const exists = authors.some(
    (author) => fullName(author).toLowerCase() === needle,
  );
  const newName = splitName(query);
  const canCreate = !exists && !!newName.firstName && !!newName.lastName;

  const pick = (authorId: string) => {
    onChange([...selected, authorId]);
    setQuery("");
  };
  const addNew = () => {
    setCreateError(null);
    create.mutate(newName);
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
        {chosen.map((author) => (
          <span
            key={author.id}
            className="bg-navy-light text-navy flex items-center gap-1 rounded-md py-0.5 pr-1 pl-2 text-sm"
          >
            {fullName(author)}
            <button
              type="button"
              onClick={() =>
                onChange(selected.filter((other) => other !== author.id))
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
            if (matches[0]) pick(matches[0].id);
            else if (canCreate) addNew();
          }}
          placeholder={chosen.length ? "Add another" : "Search authors"}
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
                onClick={() => pick(author.id)}
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
                onClick={addNew}
                disabled={create.isPending}
                className="text-primary hover:bg-surface-muted focus-visible:bg-surface-muted w-full px-3 py-2 text-left text-sm font-medium outline-none disabled:opacity-60"
              >
                {create.isPending
                  ? "Adding author…"
                  : `Add “${newName.firstName} ${newName.lastName}” as a new author`}
              </button>
            </li>
          )}
        </ul>
      )}
      {createError && (
        <p className="text-danger mt-1.5 text-sm">{createError}</p>
      )}
    </div>
  );
}
