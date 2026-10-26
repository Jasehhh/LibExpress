import Link from "next/link";

import { BookCard } from "~/components/features/books/book-card";
import { authorNames } from "~/components/features/books/book-cover";
import { GENRE_LABELS } from "~/components/features/books/genre-labels";
import { Hero } from "~/components/ui/hero";
import { SiteHeader } from "~/components/ui/site-header";
import { BOOK_GENRES } from "~/lib/schemas/book";
import { type Book, type BookGenre } from "~/lib/types";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

type SearchParams = Promise<{
  q?: string | string[];
  genre?: string | string[];
}>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? "";

const isGenre = (value: string): value is BookGenre =>
  (BOOK_GENRES as readonly string[]).includes(value);

const matches = (book: Book, query: string) => {
  const needle = query.toLowerCase();
  return [book.title, book.isbn, authorNames(book)].some((field) =>
    field.toLowerCase().includes(needle),
  );
};

const catalogHref = (query: string, genre?: BookGenre) => {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (genre) params.set("genre", genre);
  const search = params.toString();
  return `/${search ? `?${search}` : ""}#catalog`;
};

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = first(params.q);
  const genreParam = first(params.genre);
  const genre = isGenre(genreParam) ? genreParam : undefined;

  const [session, allBooks] = await Promise.all([auth(), api.book.getAll()]);
  const newestFirst = [...allBooks].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const genres = BOOK_GENRES.filter((g) =>
    allBooks.some((book) => book.genre === g),
  );
  const books = newestFirst.filter(
    (book) =>
      (!genre || book.genre === genre) && (!query || matches(book, query)),
  );

  return (
    <>
      <SiteHeader query={query} signedIn={!!session} />

      <main className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6">
        {!query && <Hero featured={newestFirst.slice(0, 3)} />}

        <section
          id="catalog"
          className={`scroll-mt-20 ${query ? "pt-4" : "pt-14"}`}
        >
          <div className="border-border flex flex-wrap items-end justify-between gap-4 border-b pb-4">
            <div>
              <h2 className="text-navy font-serif text-3xl font-medium">
                {query ? `Results for “${query}”` : "New arrivals"}
              </h2>
              <p className="text-muted mt-1 text-sm">
                {books.length === 1 ? "1 book" : `${books.length} books`}
                {query ? "" : ", newest first"}
              </p>
            </div>

            {genres.length > 1 && (
              <nav
                aria-label="Filter by genre"
                className="flex flex-wrap gap-2"
              >
                <GenreChip href={catalogHref(query)} active={!genre}>
                  All
                </GenreChip>
                {genres.map((g) => (
                  <GenreChip
                    key={g}
                    href={catalogHref(query, g)}
                    active={genre === g}
                  >
                    {GENRE_LABELS[g]}
                  </GenreChip>
                ))}
              </nav>
            )}
          </div>

          {books.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <EmptyCatalog
              filtered={!!query || !!genre}
              clearHref={catalogHref("")}
            />
          )}
        </section>
      </main>
    </>
  );
}

function GenreChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`focus-visible:ring-primary-light rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition focus-visible:ring-2 focus-visible:outline-none ${
        active
          ? "bg-navy text-on-navy ring-navy"
          : "bg-surface text-foreground ring-border hover:bg-surface-muted"
      }`}
    >
      {children}
    </Link>
  );
}

function EmptyCatalog({
  filtered,
  clearHref,
}: {
  filtered: boolean;
  clearHref: string;
}) {
  return (
    <div className="border-border mt-8 rounded-xl border border-dashed px-6 py-16 text-center">
      <p className="font-medium">
        {filtered
          ? "No books match this search."
          : "There are no books in the catalog yet."}
      </p>
      {filtered && (
        <Link
          href={clearHref}
          className="text-primary-light mt-3 inline-block text-sm font-medium underline-offset-4 hover:underline"
        >
          Show all books
        </Link>
      )}
    </div>
  );
}
