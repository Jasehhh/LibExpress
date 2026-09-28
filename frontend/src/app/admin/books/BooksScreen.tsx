"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { fetchAuthors } from "@/app/api/authorService";
import { deleteBook, fetchBooks } from "@/app/api/bookService";
import { useStaff } from "@/components/admin/StaffShell";
import { BookCover } from "@/components/catalogue/BookCover";
import { Button } from "@/components/ui/Button";
import { FilterTabs, PageHeader, SearchBox } from "@/components/ui/Controls";
import { ConfirmDialog, Dialog } from "@/components/ui/Dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Table, TBody, Td, Th, THead } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { fullName, genreLabel, GENRES, plural } from "@/lib/format";
import { useQuery } from "@/lib/useQuery";
import { Book } from "@/lib/types/book";
import { BookForm } from "./BookForm";

type Shelf = "all" | "available" | "out";

export function BooksScreen() {
  const { token } = useStaff();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [shelf, setShelf] = useState<Shelf>("all");
  const [editing, setEditing] = useState<Book | "new" | null>(null);
  const [removing, setRemoving] = useState<Book | null>(null);

  const load = useCallback(
    () => Promise.all([fetchBooks(), fetchAuthors()]).then(([books, authors]) => ({ books, authors })),
    [],
  );
  const { data, error, reload } = useQuery(load);

  const books = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.books ?? []).filter((book) => {
      if (genre && book.genre !== genre) return false;
      if (shelf === "available" && book.available_copies === 0) return false;
      if (shelf === "out" && book.available_copies > 0) return false;
      if (!needle) return true;
      return `${book.title} ${fullName(book.author)} ${book.isbn}`.toLowerCase().includes(needle);
    });
  }, [data, query, genre, shelf]);

  const totals = useMemo(() => {
    const all = data?.books ?? [];
    return {
      copies: all.reduce((sum, book) => sum + book.total_copies, 0),
      available: all.filter((book) => book.available_copies > 0).length,
      out: all.filter((book) => book.available_copies === 0).length,
    };
  }, [data]);

  return (
    <>
      <PageHeader
        title="Books"
        description={
          data
            ? `${plural(data.books.length, "title")} and ${plural(totals.copies, "copy", "copies")} in the collection.`
            : "The library collection."
        }
        actions={
          <Button onClick={() => setEditing("new")} disabled={!data}>
            Add book
          </Button>
        }
      />

      {error && !data && <ErrorState message={error.message} onRetry={reload} />}
      {!data && !error && <LoadingState label="Loading books" />}

      {data && (
        <>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
            <SearchBox
              value={query}
              onChange={setQuery}
              label="Search books"
              placeholder="Search title, author or ISBN"
              className="md:w-80"
            />
            <select
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
              aria-label="Filter by genre"
              className="h-10 rounded-md border border-rule-strong bg-surface px-3 hover:border-ink-faint"
            >
              <option value="">All genres</option>
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {genreLabel(g)}
                </option>
              ))}
            </select>
            <FilterTabs<Shelf>
              label="Filter by availability"
              value={shelf}
              onChange={setShelf}
              options={[
                { value: "all", label: "All", count: data.books.length },
                { value: "available", label: "On the shelf", count: totals.available },
                { value: "out", label: "All out", count: totals.out },
              ]}
            />
          </div>

          {data.books.length === 0 ? (
            <EmptyState
              title="The catalogue is empty"
              action={<Button onClick={() => setEditing("new")}>Add the first book</Button>}
            >
              Books you add appear here and in the public catalogue. You&apos;ll need at least one author first; you can
              add one from the book form.
            </EmptyState>
          ) : books.length === 0 ? (
            <EmptyState title="No books match">Try a different search or clear the filters.</EmptyState>
          ) : (
            <Table label="Books">
              <THead>
                <Th className="w-14">
                  <span className="sr-only">Cover</span>
                </Th>
                <Th>Title</Th>
                <Th>ISBN</Th>
                <Th>Genre</Th>
                <Th>On the shelf</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </THead>
              <TBody>
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-paper/60">
                    <Td className="py-2">
                      <BookCover title={book.title} genre={book.genre} url={book.url} size="thumb" className="w-9" />
                    </Td>
                    <Td>
                      <Link href={`/books/${book.id}`} className="font-semibold hover:text-stamp hover:underline">
                        {book.title}
                      </Link>
                      <p className="text-sm text-ink-soft">{fullName(book.author)}</p>
                    </Td>
                    <Td className="tabular-nums text-ink-soft">{book.isbn}</Td>
                    <Td className="text-ink-soft">{genreLabel(book.genre)}</Td>
                    <Td>
                      <Availability book={book} />
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(book)}>
                        Edit
                      </Button>
                      <Button variant="ghost-danger" size="sm" onClick={() => setRemoving(book)}>
                        Remove
                      </Button>
                    </Td>
                  </tr>
                ))}
              </TBody>
            </Table>
          )}

          <Dialog
            open={editing !== null}
            onClose={() => setEditing(null)}
            title={editing === "new" ? "Add a book" : "Edit book"}
            size="lg"
          >
            {editing !== null && (
              <BookForm
                book={editing === "new" ? undefined : editing}
                authors={data.authors}
                token={token}
                onCancel={() => setEditing(null)}
                onAuthorAdded={reload}
                onSaved={(saved) => {
                  toast(editing === "new" ? `Added “${saved.title}”` : `Saved “${saved.title}”`);
                  setEditing(null);
                  reload();
                }}
              />
            )}
          </Dialog>

          <ConfirmDialog
            open={removing !== null}
            onClose={() => setRemoving(null)}
            title={`Remove “${removing?.title ?? ""}”?`}
            confirmLabel="Remove book"
            onConfirm={async () => {
              if (!removing) return;
              await deleteBook(removing.id, token);
              toast(`Removed “${removing.title}”`);
              reload();
            }}
          >
            The book leaves the catalogue for good. Books that are on loan, or have past loans on record, can&apos;t be
            removed.
          </ConfirmDialog>
        </>
      )}
    </>
  );
}

function Availability({ book }: { book: Book }) {
  const share = book.total_copies > 0 ? book.available_copies / book.total_copies : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-rule" aria-hidden>
        <span
          className={`block h-full rounded-full ${book.available_copies > 0 ? "bg-shelf" : "bg-overdue"}`}
          style={{ width: `${Math.max(share * 100, book.total_copies > 0 ? 4 : 0)}%` }}
        />
      </span>
      <span className="tabular-nums text-sm">
        <span className={book.available_copies === 0 ? "font-semibold text-overdue" : "font-semibold"}>
          {book.available_copies}
        </span>
        <span className="text-ink-soft"> of {book.total_copies}</span>
      </span>
    </div>
  );
}
