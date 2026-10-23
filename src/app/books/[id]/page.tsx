import { TRPCError } from "@trpc/server";
import { type Metadata } from "next";
import Image from "next/image";
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

// The cover column and the text column line up across the dark band and the
// page below it, so both grids share these widths.
const COLUMNS =
  "md:grid-cols-[16rem_1fr] lg:grid-cols-[20rem_1fr] md:gap-12 lg:gap-16";

export default async function BookPage({ params }: { params: Params }) {
  const { id } = await params;
  const [session, book] = await Promise.all([auth(), getBook(id)]);

  return (
    <>
      <SiteHeader query="" signedIn={!!session} />

      <section className="bg-navy text-on-navy relative isolate overflow-hidden">
        <Image
          src="/hero-library.svg"
          alt=""
          fill
          priority
          unoptimized
          className="-z-10 object-cover object-[50%_40%] opacity-60"
        />
        <div
          aria-hidden
          className="from-navy via-navy/85 to-navy/40 absolute inset-0 -z-10 bg-gradient-to-r"
        />

        <div className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6 md:pb-16">
          <Link
            href="/#catalog"
            className="text-on-navy-muted inline-block rounded text-sm hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            Back to the catalog
          </Link>

          <div className={`mt-8 grid ${COLUMNS}`}>
            <div aria-hidden className="hidden md:block" />
            <div className="min-w-0">
              <Link
                href={`/?genre=${book.genre}#catalog`}
                className="text-sm font-medium text-[#7fd1c4] underline-offset-4 hover:underline"
              >
                {GENRE_LABELS[book.genre]}
              </Link>
              <h1 className="mt-2 font-serif text-4xl leading-[1.05] font-medium text-balance sm:text-6xl">
                {book.title}
              </h1>
              <p className="text-on-navy-muted mt-4 text-lg">
                {authorNames(book)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className={`mx-auto grid max-w-6xl px-4 pb-24 sm:px-6 ${COLUMNS}`}>
        <div className="-mt-16 mb-12 md:-mt-48 md:mb-0">
          <BoundCover book={book} />
        </div>

        <article className="min-w-0 md:pt-10">
          <Shelf book={book} />

          {book.description && (
            <p className="mt-10 max-w-prose font-serif text-xl leading-relaxed whitespace-pre-line">
              {book.description}
            </p>
          )}

          <CatalogCard book={book} />
        </article>
      </main>
    </>
  );
}

// A cover with a darker bound edge on the left and a block of page edges
// showing on the right, so it reads as a book rather than a picture of one.
function BoundCover({ book }: { book: Book }) {
  return (
    <div className="relative mx-auto w-full max-w-60 md:max-w-none">
      <div
        aria-hidden
        className="absolute inset-y-1.5 -right-2.5 left-4 rounded-r-sm bg-[repeating-linear-gradient(to_bottom,#f6f1e6_0_2px,#e4dccb_2px_3px)] shadow-[0_30px_50px_-20px_rgba(10,15,30,0.6)]"
      />
      <div className="bg-surface-muted relative aspect-[2/3] overflow-hidden rounded-sm rounded-r-md shadow-[0_2px_4px_rgba(10,15,30,0.25)]">
        <BookCover
          book={book}
          sizes="(min-width: 1024px) 20rem, (min-width: 768px) 16rem, 15rem"
          priority
        />
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-black/45 via-white/15 to-transparent"
        />
      </div>
    </div>
  );
}

// One spine per copy standing on a shelf: a filled spine is on the shelf, an
// empty outline is out on loan.
const SPINE_COLORS = ["#00433d", "#182442", "#2d847b", "#6b2d3a", "#a0763a"];
const SPINE_HEIGHTS = [
  "h-14",
  "h-16",
  "h-[3.75rem]",
  "h-[4.25rem]",
  "h-[3.5rem]",
];
const MAX_SPINES = 12;

function Shelf({ book }: { book: Book }) {
  if (book.totalCopies === 0) {
    return (
      <p className="text-muted text-lg">
        The library doesn’t have a copy of this book yet.
      </p>
    );
  }

  const onLoan = book.totalCopies - book.availableCopies;
  const shown = Math.min(book.totalCopies, MAX_SPINES);

  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-5">
      <div aria-hidden className="w-fit">
        <div className="flex items-end gap-1 px-2">
          {Array.from({ length: shown }, (_, i) =>
            i < book.availableCopies ? (
              <span
                key={i}
                className={`w-5 rounded-t-sm ${SPINE_HEIGHTS[i % SPINE_HEIGHTS.length]}`}
                style={{
                  backgroundColor: SPINE_COLORS[i % SPINE_COLORS.length],
                }}
              />
            ) : (
              <span
                key={i}
                className={`border-border w-5 rounded-t-sm border-2 border-b-0 border-dashed ${SPINE_HEIGHTS[i % SPINE_HEIGHTS.length]}`}
              />
            ),
          )}
        </div>
        <div className="h-2 rounded-sm bg-[#5a4031] shadow-[0_3px_0_#3b2a20]" />
      </div>

      <div>
        <p className="text-navy text-3xl font-semibold tabular-nums">
          {book.availableCopies} of {book.totalCopies}
          <span className="text-muted ml-2 text-base font-normal">
            {book.totalCopies === 1 ? "copy" : "copies"} on the shelf
          </span>
        </p>
        <p className="text-muted mt-1 text-sm">
          {book.availableCopies === 0
            ? book.totalCopies === 1
              ? "The only copy is out on loan right now."
              : `All ${book.totalCopies} copies are out on loan right now.`
            : onLoan > 0
              ? `${onLoan} out on loan. Ask at the front desk to borrow one.`
              : "Ask at the front desk to borrow one."}
        </p>
      </div>
    </div>
  );
}

// The book's record laid out like a card from a library card catalog: a red
// heading rule over faint blue ruled lines.
function CatalogCard({ book }: { book: Book }) {
  const added = book.createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="mt-12 max-w-xl -rotate-[0.6deg] rounded-sm bg-[#fffdf7] px-6 pt-5 pb-6 shadow-[0_1px_2px_rgba(24,36,66,0.15),0_12px_24px_-12px_rgba(24,36,66,0.35)]">
      <p className="font-serif text-lg">
        {book.authors.map((author) => author.lastName).join(", ")}
      </p>
      <div className="mt-2 border-b-2 border-[#d9726a]" />
      <dl className="grid grid-cols-[6rem_1fr] text-sm">
        <Detail term="Title">{book.title}</Detail>
        <Detail term="ISBN">{book.isbn}</Detail>
        <Detail term="Genre">{GENRE_LABELS[book.genre]}</Detail>
        <Detail term="Copies">{book.totalCopies}</Detail>
        <Detail term="Added">{added}</Detail>
      </dl>
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
      <dt className="text-muted flex h-9 items-end border-b border-[#c9d9ee] pb-1.5">
        {term}
      </dt>
      <dd className="flex h-9 min-w-0 items-end border-b border-[#c9d9ee] pb-1.5 tabular-nums">
        <span className="truncate">{children}</span>
      </dd>
    </>
  );
}
