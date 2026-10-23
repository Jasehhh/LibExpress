import { TRPCError } from "@trpc/server";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { authorNames, BookCover } from "~/components/features/books/book-cover";
import { GENRE_LABELS } from "~/components/features/books/genre-labels";
import { SiteHeader } from "~/components/public/site-header";
import { idInput } from "~/lib/schemas/common";
import { type Book } from "~/lib/types";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

type Params = Promise<{ id: string }>;

const getBook = cache(async (id: string) => {
  if (!idInput.safeParse({ id }).success) notFound();
  try {
    return await api.book.getById({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const book = await getBook((await params).id);
  return { title: `${book.title} | LibExpress` };
}

export default async function BookPage({ params }: { params: Params }) {
  const { id } = await params;
  const [session, book] = await Promise.all([auth(), getBook(id)]);

  return (
    <>
      <SiteHeader query="" signedIn={!!session} />

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-20 sm:px-6">
        <Link
          href="/#catalog"
          className="text-muted hover:text-foreground focus-visible:ring-primary-light inline-block rounded text-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          Back to the catalog
        </Link>

        <div className="mt-6 grid gap-10 md:grid-cols-[minmax(0,18rem)_1fr] lg:grid-cols-[minmax(0,24rem)_1fr] lg:gap-16">
          <div className="bg-surface-muted relative mx-auto aspect-[2/3] w-full max-w-72 self-start overflow-hidden rounded-md shadow-[0_1px_0_var(--color-border),0_24px_48px_-20px_rgba(24,36,66,0.55)] md:max-w-none">
            <BookCover
              book={book}
              sizes="(min-width: 1024px) 24rem, 18rem"
              priority
            />
          </div>

          <article className="flex min-w-0 flex-col">
            <Link
              href={`/?genre=${book.genre}#catalog`}
              className="text-primary-light text-sm font-medium underline-offset-4 hover:underline"
            >
              {GENRE_LABELS[book.genre]}
            </Link>
            <h1 className="text-navy mt-2 font-serif text-4xl leading-tight font-medium text-balance sm:text-5xl">
              {book.title}
            </h1>
            <p className="text-muted mt-3 text-lg">{authorNames(book)}</p>

            <Availability book={book} />

            {book.description && (
              <p className="mt-8 max-w-prose leading-relaxed whitespace-pre-line">
                {book.description}
              </p>
            )}

            <div aria-hidden className="flex-1" />
            <dl className="border-border mt-10 grid max-w-prose grid-cols-[8rem_1fr] border-t text-sm">
              <Detail term="ISBN">{book.isbn}</Detail>
              <Detail term="Genre">{GENRE_LABELS[book.genre]}</Detail>
              <Detail term="Copies">{book.totalCopies}</Detail>
              <Detail term="Added">
                {book.createdAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </Detail>
            </dl>
          </article>
        </div>
      </main>
    </>
  );
}

function Availability({ book }: { book: Book }) {
  if (book.totalCopies === 0) {
    return (
      <p className="border-border mt-8 border-l-2 pl-4">
        The library doesn’t have a copy of this book yet.
      </p>
    );
  }

  return (
    <div
      className={`mt-8 border-l-2 pl-4 ${
        book.availableCopies > 0 ? "border-primary-light" : "border-border"
      }`}
    >
      <p className="text-2xl font-semibold tabular-nums">
        {book.availableCopies} of {book.totalCopies}{" "}
        {book.totalCopies === 1 ? "copy" : "copies"} available
      </p>
      <p className="text-muted mt-1 text-sm">
        {book.availableCopies > 0
          ? "Ask at the front desk to borrow one."
          : book.totalCopies === 1
            ? "The only copy is out on loan right now."
            : `All ${book.totalCopies} copies are out on loan right now.`}
      </p>
    </div>
  );
}

function Detail({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted border-border border-b py-3">{term}</dt>
      <dd className="border-border border-b py-3 tabular-nums">{children}</dd>
    </>
  );
}
