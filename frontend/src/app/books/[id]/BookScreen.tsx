"use client";

import Link from "next/link";
import { useCallback, useMemo } from "react";
import { fetchBook, fetchBooks } from "@/app/api/bookService";
import { availabilityText } from "@/components/catalogue/Availability";
import { BookCover } from "@/components/catalogue/BookCover";
import { SiteFooter, SiteHeader } from "@/components/catalogue/SiteHeader";
import { ErrorState } from "@/components/ui/States";
import { ApiError } from "@/lib/client";
import { formatDate, fullName, genreLabel } from "@/lib/format";
import { LOAN_PERIOD_DAYS } from "@/lib/rules";
import { isUuid } from "@/lib/schemas/validate";
import { useQuery } from "@/lib/useQuery";

export function BookScreen({ id }: { id: string }) {
  const validId = isUuid(id);
  const load = useCallback(() => fetchBook(id), [id]);
  const { data: book, error, reload } = useQuery(validId ? load : null);
  const { data: all } = useQuery(fetchBooks);

  const moreByAuthor = useMemo(
    () => (book && all ? all.filter((b) => b.author_id === book.author_id && b.id !== book.id).slice(0, 5) : []),
    [book, all],
  );

  const missing = !validId || (error instanceof ApiError && error.status === 404);

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 sm:py-12">
        <Link href="/" className="mb-8 inline-flex text-sm font-semibold text-stamp hover:underline">
          Back to the catalogue
        </Link>

        {missing ? (
          <div className="max-w-prose py-8">
            <h1 className="font-serif text-3xl font-semibold">We couldn&apos;t find that book</h1>
            <p className="mt-2 text-ink-soft">It may have been removed from the catalogue, or the link is incomplete.</p>
          </div>
        ) : (
          error &&
          !book && <ErrorState message={error.message} onRetry={reload} />
        )}
        {!book && !error && !missing && (
          <div role="status" className="grid gap-10 md:grid-cols-[17rem_1fr]">
            <div className="aspect-[2/3] w-52 animate-pulse rounded-[3px] bg-rule md:w-full" />
            <div className="h-80 animate-pulse rounded-[3px] bg-surface" />
            <span className="sr-only">Loading book…</span>
          </div>
        )}

        {book && (
          <>
            <article className="grid gap-10 md:grid-cols-[17rem_1fr] md:gap-14">
              <BookCover
                title={book.title}
                author={fullName(book.author)}
                genre={book.genre}
                url={book.url}
                size="feature"
                priority
                className="w-52 md:w-full"
              />

              <div className="min-w-0">
                {/* Laid out like a typed catalog card: author entry above the red rule. */}
                <div className="catalog-card px-6 pb-7 sm:px-8">
                  <div className="flex h-14 items-center justify-between gap-4 text-[0.9375rem]">
                    <span className="truncate font-semibold">
                      {book.author.last_name}, {book.author.first_name}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink-soft">ISBN {book.isbn}</span>
                  </div>
                  <div className="pt-7 leading-7">
                    <h1 className="font-serif text-[1.5rem] font-semibold leading-7">
                      {book.title}
                    </h1>
                    <p className="text-ink-soft">
                      by {fullName(book.author)}. {genreLabel(book.genre)}.
                    </p>
                    <div className="mt-7 max-w-[68ch] whitespace-pre-line">
                      {book.description ? (
                        book.description
                      ) : (
                        <span className="text-ink-faint">No description has been added for this book.</span>
                      )}
                    </div>
                    <p className="mt-7 text-sm text-ink-soft">Added to the library {formatDate(book.created_at)}</p>
                  </div>
                </div>

                <div
                  className={`mt-6 rounded-md border px-6 py-5 ${
                    book.available_copies > 0 ? "border-shelf/30 bg-shelf-wash" : "border-rule bg-surface"
                  }`}
                >
                  <p
                    className={`font-serif text-xl font-semibold ${book.available_copies > 0 ? "text-shelf" : "text-ink"}`}
                  >
                    {availabilityText(book.available_copies, book.total_copies)}
                  </p>
                  <p className="mt-1 text-ink-soft">
                    {book.available_copies > 0
                      ? `Bring your library card to the circulation desk to borrow it for ${LOAN_PERIOD_DAYS} days.`
                      : book.total_copies > 0
                        ? `Copies come back within ${LOAN_PERIOD_DAYS} days of checkout. Ask at the desk when one is due back.`
                        : "Ask at the circulation desk when copies will be available."}
                  </p>
                </div>
              </div>
            </article>

            {moreByAuthor.length > 0 && (
              <section aria-labelledby="more-heading" className="mt-16 border-t border-rule pt-10">
                <h2 id="more-heading" className="mb-6 font-serif text-[1.3125rem] font-semibold">
                  More by {fullName(book.author)}
                </h2>
                <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-5">
                  {moreByAuthor.map((other) => (
                    <li key={other.id}>
                      <Link href={`/books/${other.id}`} className="group block">
                        <BookCover title={other.title} author={fullName(other.author)} genre={other.genre} url={other.url} />
                        <p className="mt-3 font-serif font-semibold leading-snug group-hover:text-stamp group-hover:underline">
                          {other.title}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
