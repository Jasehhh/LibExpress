"use client";

import Link from "next/link";
import { ReactNode, useMemo, useState } from "react";
import { fetchBooks } from "@/app/api/bookService";
import { AvailabilityLine } from "@/components/catalogue/Availability";
import { BookCover } from "@/components/catalogue/BookCover";
import { SiteFooter, SiteHeader } from "@/components/catalogue/SiteHeader";
import { SearchBox } from "@/components/ui/Controls";
import { ErrorState } from "@/components/ui/States";
import { fullName, genreLabel, GENRES, plural } from "@/lib/format";
import { useQuery } from "@/lib/useQuery";

type Sort = "title" | "newest";

export function CatalogueScreen() {
  const { data: books, error, reload } = useQuery(fetchBooks);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("title");

  const genres = useMemo(
    () =>
      GENRES.map((g) => ({ genre: g, count: (books ?? []).filter((book) => book.genre === g).length })).filter(
        (g) => g.count > 0,
      ),
    [books],
  );

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = (books ?? []).filter((book) => {
      if (genre && book.genre !== genre) return false;
      if (availableOnly && book.available_copies === 0) return false;
      if (!needle) return true;
      return `${book.title} ${fullName(book.author)} ${book.isbn}`.toLowerCase().includes(needle);
    });
    if (sort === "newest") {
      return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return list; // The API already sorts by title.
  }, [books, query, genre, availableOnly, sort]);

  const filtered = Boolean(query.trim() || genre || availableOnly);

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="border-b border-rule bg-surface">
          <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-12 sm:px-8 sm:pt-16">
            <h1 className="max-w-3xl font-serif text-[2.625rem] font-semibold leading-[1.05] tracking-[-0.02em] sm:text-[3.75rem]">
              Find a book on our shelves
            </h1>
            <p className="mt-4 max-w-xl text-lg text-ink-soft">
              {books
                ? `Search ${plural(books.length, "title")} by title, author or ISBN, and see which are ready to borrow today.`
                : "Search the collection by title, author or ISBN, and see which books are ready to borrow today."}
            </p>
            <SearchBox
              value={query}
              onChange={setQuery}
              label="Search the catalogue"
              placeholder="Try a title, an author or an ISBN"
              className="mt-8 max-w-2xl [&_input]:h-14 [&_input]:text-lg [&_input]:pl-11 [&_svg]:left-4 [&_svg]:size-5"
            />
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">
          {genres.length > 0 && (
            <div role="group" aria-label="Filter by genre" className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
              <GenreChip active={genre === ""} onClick={() => setGenre("")}>
                All genres
              </GenreChip>
              {genres.map(({ genre: g, count }) => (
                <GenreChip key={g} active={genre === g} onClick={() => setGenre(genre === g ? "" : g)}>
                  {genreLabel(g)} <span className="tabular-nums opacity-60">{count}</span>
                </GenreChip>
              ))}
            </div>
          )}

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-4">
            <p className="text-ink-soft" aria-live="polite">
              {books ? (filtered ? `${plural(results.length, "book")} found` : `${plural(books.length, "book")} in the collection`) : " "}
            </p>
            <div className="flex flex-wrap items-center gap-5 text-[0.9375rem]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(event) => setAvailableOnly(event.target.checked)}
                  className="size-4 accent-stamp"
                />
                On the shelf now
              </label>
              <label className="flex items-center gap-2">
                <span className="text-ink-soft">Sort by</span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as Sort)}
                  className="h-9 rounded-md border border-rule-strong bg-surface px-2"
                >
                  <option value="title">Title</option>
                  <option value="newest">Newest additions</option>
                </select>
              </label>
            </div>
          </div>

          {error && !books && <ErrorState message={error.message} onRetry={reload} />}
          {!books && !error && <ShelfSkeleton />}

          {books && results.length === 0 && (
            <div className="max-w-prose py-10">
              <p className="font-serif text-2xl font-semibold">
                {books.length === 0 ? "The shelves are still empty" : "No books match your search"}
              </p>
              <p className="mt-2 text-ink-soft">
                {books.length === 0
                  ? "The library hasn't added any books yet. Check back soon."
                  : "Check the spelling, try the author's last name, or clear the filters."}
              </p>
              {filtered && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setGenre("");
                    setAvailableOnly(false);
                  }}
                  className="mt-4 font-semibold text-stamp hover:underline"
                >
                  Clear search and filters
                </button>
              )}
            </div>
          )}

          {results.length > 0 && (
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {results.map((book, index) => (
                <li key={book.id}>
                  <Link href={`/books/${book.id}`} className="group block rounded-sm">
                    <BookCover
                      title={book.title}
                      author={fullName(book.author)}
                      genre={book.genre}
                      url={book.url}
                      priority={index < 5}
                      className="transition-transform duration-200 group-hover:-translate-y-1"
                    />
                    <p className="mt-3 font-serif text-[1.0625rem] font-semibold leading-snug group-hover:text-stamp group-hover:underline">
                      {book.title}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-soft">{fullName(book.author)}</p>
                  </Link>
                  <div className="mt-1.5">
                    <AvailabilityLine available={book.available_copies} total={book.total_copies} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function GenreChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-rule-strong bg-surface text-ink-soft hover:border-ink-faint hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function ShelfSkeleton() {
  return (
    <div role="status" className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] animate-pulse rounded-[3px] bg-rule" />
          <div className="mt-3 h-4 w-4/5 animate-pulse rounded-sm bg-rule" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded-sm bg-rule/70" />
        </div>
      ))}
      <span className="sr-only">Loading the catalogue…</span>
    </div>
  );
}
