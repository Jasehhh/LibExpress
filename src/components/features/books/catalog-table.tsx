"use client";

import { useState } from "react";

import { BookFormDialog } from "~/components/features/books/book-form-dialog";
import { authorNames, BookCover } from "~/components/features/books/book-cover";
import { DeleteBookDialog } from "~/components/features/books/delete-book-dialog";
import { GENRE_LABELS } from "~/components/features/books/genre-labels";
import {
  ACTION_ICONS,
  FilterSelect,
  IconButton,
  IconLink,
  Pagination,
  SearchInput,
  TABLE_HEAD_CLASS,
  TableCard,
  TableEmpty,
  TableIntro,
} from "~/components/ui/data-table";
import { Pill } from "~/components/ui/pill";
import { BOOK_GENRES } from "~/lib/schemas/book";
import { type Book, type BookGenre } from "~/lib/types";
import { api } from "~/trpc/react";

const PAGE_SIZE = 10;

const STATUSES = {
  available: { label: "Available", tone: "good" },
  out: { label: "All checked out", tone: "info" },
  none: { label: "No copies", tone: "neutral" },
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
      <TableIntro
        summary={`${count.format(books.length)} ${books.length === 1 ? "title" : "titles"} and ${count.format(copies)} ${copies === 1 ? "copy" : "copies"}. Add books, change their details and set how many copies are on the shelf.`}
        addLabel="Add book"
        onAdd={() => setAdding(true)}
      />

      <TableCard
        label="Books"
        toolbar={
          <>
            <SearchInput
              id="catalog-filter"
              label="Search books"
              value={query}
              onChange={filter(setQuery)}
              placeholder="Search by title, author or ISBN"
            />
            <FilterSelect
              label="Genre"
              value={genre}
              onChange={(value) => filter(setGenre)(value as BookGenre | "")}
              options={[
                ["", "All genres"],
                ...BOOK_GENRES.map((g) => [g, GENRE_LABELS[g]] as const),
              ]}
            />
            <FilterSelect
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
          </>
        }
      >
        {shown.length > 0 ? (
          // Fixed layout: the book column takes what the others leave and
          // long titles truncate, so the table never scrolls sideways.
          <table className="w-full table-fixed text-left text-sm">
            <thead className={TABLE_HEAD_CLASS}>
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
                const { label, tone } = STATUSES[statusOf(book)];
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
                          <span className="mt-1 inline-block sm:hidden">
                            <Pill tone={tone}>{label}</Pill>
                          </span>
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
                      <span className="text-muted"> of {book.totalCopies}</span>
                    </td>
                    <td className="hidden px-5 py-3 sm:table-cell">
                      <Pill tone={tone}>{label}</Pill>
                    </td>
                    <td className="px-3 py-3 sm:px-5">
                      <div className="flex justify-end gap-1">
                        <IconLink
                          href={`/books/${book.id}`}
                          label={`View ${book.title} in the public catalog`}
                        >
                          {ACTION_ICONS.view}
                        </IconLink>
                        <IconButton
                          label={`Edit ${book.title}`}
                          onClick={() => setEditing(book)}
                        >
                          {ACTION_ICONS.edit}
                        </IconButton>
                        <IconButton
                          label={`Delete ${book.title}`}
                          onClick={() => setDeleting(book)}
                          danger
                        >
                          {ACTION_ICONS.delete}
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : filtering ? (
          <TableEmpty
            title="No books match these filters."
            onClear={() => {
              setQuery("");
              setGenre("");
              setStatus("");
              setPage(1);
            }}
          />
        ) : (
          <TableEmpty
            title="The catalog is empty."
            body="Add the first book to start lending."
          />
        )}

        {filtered.length > 0 && (
          <Pagination
            page={current}
            pageSize={PAGE_SIZE}
            shown={shown.length}
            total={filtered.length}
            onPage={setPage}
          />
        )}
      </TableCard>

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
