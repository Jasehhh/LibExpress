"use client";

import Link from "next/link";
import { useState } from "react";

import { BookFormDialog } from "~/components/features/books/book-form-dialog";
import { authorNames, BookCover } from "~/components/features/books/book-cover";
import { DeleteBookDialog } from "~/components/features/books/delete-book-dialog";
import { GENRE_LABELS } from "~/components/features/books/genre-labels";
import { BUTTON_CLASS, INPUT_CLASS } from "~/components/ui/form-field";
import { BOOK_GENRES } from "~/lib/schemas/book";
import { type Book, type BookGenre } from "~/lib/types";
import { api } from "~/trpc/react";

const PAGE_SIZE = 10;

const STATUSES = {
  available: { label: "Available", badge: "bg-success-light text-success" },
  out: { label: "All checked out", badge: "bg-info-light text-info" },
  none: { label: "No copies", badge: "bg-surface-muted text-muted" },
} as const;
type Status = keyof typeof STATUSES;

const statusOf = (book: Book): Status =>
  book.totalCopies === 0
    ? "none"
    : book.availableCopies === 0
      ? "out"
      : "available";

const matches = (book: Book, query: string) => {
  const needle = query.toLowerCase();
  return [book.title, book.isbn, authorNames(book)].some((field) =>
    field.toLowerCase().includes(needle),
  );
};

const count = new Intl.NumberFormat("en-PH");

export function CatalogTable() {
  const [books] = api.book.getAll.useSuspenseQuery();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState<BookGenre | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Book | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Book | null>(null);

  const filtered = books.filter(
    (book) =>
      (!query.trim() || matches(book, query.trim())) &&
      (!genre || book.genre === genre) &&
      (!status || statusOf(book) === status),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const copies = books.reduce((sum, book) => sum + book.totalCopies, 0);
  const filtering = !!query.trim() || !!genre || !!status;

  // Any change to the filters starts the list again from the first page.
  const filter =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-muted text-sm">
          {count.format(books.length)} {books.length === 1 ? "title" : "titles"}{" "}
          and {count.format(copies)} {copies === 1 ? "copy" : "copies"}. Add
          books, change their details and set how many copies are on the shelf.
        </p>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={BUTTON_CLASS.primary}
        >
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
          Add book
        </button>
      </div>

      <section
        aria-label="Books"
        className="border-navy-light bg-surface mt-6 overflow-hidden rounded-2xl border"
      >
        <div className="border-border flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative min-w-56 flex-1">
            <label htmlFor="catalog-filter" className="sr-only">
              Search books
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
              id="catalog-filter"
              type="search"
              value={query}
              onChange={(event) => filter(setQuery)(event.target.value)}
              placeholder="Search by title, author or ISBN"
              className={`${INPUT_CLASS} h-10 pl-9`}
            />
          </div>
          <Select
            label="Genre"
            value={genre}
            onChange={(value) => filter(setGenre)(value as BookGenre | "")}
            options={[
              ["", "All genres"],
              ...BOOK_GENRES.map((g) => [g, GENRE_LABELS[g]] as const),
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(value) => filter(setStatus)(value as Status | "")}
            options={[
              ["", "Any status"],
              ...Object.entries(STATUSES).map(
                ([key, { label }]) => [key, label] as const,
              ),
            ]}
          />
        </div>

        {shown.length > 0 ? (
          <div>
            {/* Fixed layout: the book column takes what the others leave and
                long titles truncate, so the table never scrolls sideways. */}
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-surface-muted/60 text-muted">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium sm:px-5">
                    Book
                  </th>
                  <th
                    scope="col"
                    className="hidden w-40 px-5 py-3 font-medium md:table-cell"
                  >
                    ISBN
                  </th>
                  <th
                    scope="col"
                    className="hidden w-28 px-5 py-3 font-medium xl:table-cell"
                  >
                    Genre
                  </th>
                  <th
                    scope="col"
                    className="hidden w-32 px-5 py-3 font-medium whitespace-nowrap lg:table-cell"
                  >
                    On the shelf
                  </th>
                  <th
                    scope="col"
                    className="hidden w-40 px-5 py-3 font-medium sm:table-cell"
                  >
                    Status
                  </th>
                  <th scope="col" className="w-36 px-3 py-3 sm:w-40 sm:px-5">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {shown.map((book) => {
                  const { label, badge } = STATUSES[statusOf(book)];
                  return (
                    <tr key={book.id} className="hover:bg-background">
                      <td className="px-3 py-3 sm:px-5">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-sm shadow-[1px_1px_3px_rgba(24,36,66,0.25)]">
                            <BookCover book={book} sizes="2.5rem" compact />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-foreground truncate font-semibold"
                              title={book.title}
                            >
                              {book.title}
                            </p>
                            <p className="text-muted truncate">
                              {authorNames(book) || "No author"}
                            </p>
                            {/* Phones have no status column. */}
                            <p
                              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold sm:hidden ${badge}`}
                            >
                              {label}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-muted hidden px-5 py-3 tabular-nums md:table-cell">
                        {book.isbn}
                      </td>
                      <td className="hidden truncate px-5 py-3 xl:table-cell">
                        {GENRE_LABELS[book.genre]}
                      </td>
                      <td className="hidden px-5 py-3 whitespace-nowrap tabular-nums lg:table-cell">
                        {book.availableCopies}
                        <span className="text-muted">
                          {" "}
                          of {book.totalCopies}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3 sm:table-cell">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${badge}`}
                        >
                          {label}
                        </span>
                      </td>
                      <td className="px-3 py-3 sm:px-5">
                        <div className="flex justify-end gap-1">
                          <IconLink
                            href={`/books/${book.id}`}
                            label={`View ${book.title} in the public catalog`}
                          >
                            <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
                            <circle cx="12" cy="12" r="3" />
                          </IconLink>
                          <IconButton
                            label={`Edit ${book.title}`}
                            onClick={() => setEditing(book)}
                          >
                            <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
                          </IconButton>
                          <IconButton
                            label={`Delete ${book.title}`}
                            onClick={() => setDeleting(book)}
                            danger
                          >
                            <path d="M5 7h14M10 11v6M14 11v6M6.5 7l1 12.5h9L17.5 7M9.5 7V4.5h5V7" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <p className="font-medium">
              {filtering
                ? "No books match these filters."
                : "The catalog is empty."}
            </p>
            {filtering ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setGenre("");
                  setStatus("");
                  setPage(1);
                }}
                className="text-primary-light mt-3 text-sm font-medium underline-offset-4 hover:underline"
              >
                Clear filters
              </button>
            ) : (
              <p className="text-muted mt-1 text-sm">
                Add the first book to start lending.
              </p>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <footer className="border-border text-muted flex flex-wrap items-center justify-between gap-3 border-t px-5 py-3 text-sm">
            <p className="tabular-nums">
              Showing {(current - 1) * PAGE_SIZE + 1}–
              {(current - 1) * PAGE_SIZE + shown.length} of{" "}
              {count.format(filtered.length)}
            </p>
            {pages > 1 && (
              <nav aria-label="Pages" className="flex items-center gap-2">
                <PageButton
                  label="Previous page"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  <path d="m15 6-6 6 6 6" />
                </PageButton>
                <span className="text-foreground px-1 tabular-nums">
                  Page {current} of {pages}
                </span>
                <PageButton
                  label="Next page"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  <path d="m9 6 6 6-6 6" />
                </PageButton>
              </nav>
            )}
          </footer>
        )}
      </section>

      <BookFormDialog
        open={adding || !!editing}
        book={editing}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
      />
      <DeleteBookDialog book={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}

function Select({
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

function IconButton({
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

function IconLink({
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
