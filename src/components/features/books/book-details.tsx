import "server-only";

import { TRPCError } from "@trpc/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { TIME_ZONE } from "~/lib/time";
import { type Book } from "~/lib/types";
import { api } from "~/trpc/server";
import { authorNames, BookCover } from "./book-cover";
import { GENRE_LABELS } from "./genre-labels";

export const getBook = cache(async (id: string) => {
  try {
    return await api.book.getById({ id });
  } catch (error) {
    if (
      error instanceof TRPCError &&
      (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")
    ) {
      notFound();
    }
    throw error;
  }
});

// The full page has room to spread out. The modal has to fit on screen
// without scrolling, so it uses a narrower cover, smaller type and a short
// description. The cover column and the text column line up across the dark
// band and the part below it, so both grids share `columns`.
const LAYOUTS = {
  page: {
    columns:
      "md:grid-cols-[16rem_1fr] lg:grid-cols-[20rem_1fr] md:gap-12 lg:gap-16",
    band: "pt-6 pb-24 md:pb-16",
    heading: "mt-8",
    title: "text-4xl sm:text-6xl",
    author: "mt-4 text-lg",
    body: "pb-16",
    cover: "-mt-16 mb-12 md:-mt-48 md:mb-0",
    article: "md:pt-10",
    description: "mt-10 text-xl",
  },
  modal: {
    columns: "md:grid-cols-[13rem_1fr] md:gap-10",
    band: "pt-6 pb-20 md:pb-8",
    heading: "mt-4",
    title: "text-3xl sm:text-4xl",
    author: "mt-2",
    body: "pb-8",
    cover: "-mt-14 mb-8 md:-mt-28 md:mb-0",
    article: "md:pt-6",
    description: "mt-6 text-lg line-clamp-3",
  },
};

// Used by the full page and by the modal over the catalog. `back` is what
// sits above the title, and `inner` sets the width and side padding.
export function BookDetails({
  book,
  back,
  inner,
  layout,
}: {
  book: Book;
  back: React.ReactNode;
  inner: string;
  layout: keyof typeof LAYOUTS;
}) {
  const l = LAYOUTS[layout];
  return (
    <>
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

        <div className={`${inner} ${l.band}`}>
          {back}

          <div className={`grid ${l.heading} ${l.columns}`}>
            <div aria-hidden className="hidden md:block" />
            <div className="min-w-0">
              <Link
                href={`/?genre=${book.genre}#catalog`}
                className="text-sm font-medium text-[#7fd1c4] underline-offset-4 hover:underline"
              >
                {GENRE_LABELS[book.genre]}
              </Link>
              <h1
                className={`mt-2 font-serif leading-[1.05] font-medium text-balance ${l.title}`}
              >
                {book.title}
              </h1>
              <p className={`text-on-navy-muted ${l.author}`}>
                {authorNames(book)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className={`${inner} grid ${l.body} ${l.columns}`}>
        <div className={l.cover}>
          <BoundCover book={book} />
        </div>

        <article className={`min-w-0 ${l.article}`}>
          <Availability book={book} />

          {book.description && (
            <p
              className={`max-w-prose font-serif leading-relaxed whitespace-pre-line ${l.description}`}
            >
              {book.description}
            </p>
          )}

          <CatalogCard book={book} compact={layout === "modal"} />
        </article>
      </div>
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

function Availability({ book }: { book: Book }) {
  if (book.totalCopies === 0) {
    return (
      <p className="text-muted text-lg">
        The library doesn’t have a copy of this book yet.
      </p>
    );
  }

  const onLoan = book.totalCopies - book.availableCopies;

  return (
    <div>
      <p className="text-navy text-3xl font-semibold tabular-nums">
        {book.availableCopies} of {book.totalCopies}
        <span className="text-muted ml-2 text-base font-normal">
          {book.totalCopies === 1 ? "copy" : "copies"} on the shelf
        </span>
      </p>
      <p className="text-muted mt-1 text-sm">
        {book.availableCopies === 0 ? (
          book.totalCopies === 1 ? (
            "The only copy is out on loan right now."
          ) : (
            `All ${book.totalCopies} copies are out on loan right now.`
          )
        ) : (
          <>
            {onLoan > 0 && `${onLoan} out on loan. `}
            <strong className="text-foreground font-semibold">
              Ask at the front desk to borrow one.
            </strong>
          </>
        )}
      </p>
    </div>
  );
}

// The book's record laid out like a card from a library card catalog: a red
// heading rule over faint blue ruled lines.
function CatalogCard({ book, compact }: { book: Book; compact: boolean }) {
  const added = book.createdAt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: TIME_ZONE,
  });

  return (
    <div
      className={`${compact ? "mt-6 pt-3 pb-4" : "mt-12 pt-5 pb-6"} max-w-xl -rotate-[0.6deg] rounded-sm bg-[#fffdf7] px-6 shadow-[0_1px_2px_rgba(24,36,66,0.15),0_12px_24px_-12px_rgba(24,36,66,0.35)]`}
    >
      <p className="font-serif text-lg">
        {book.authors.map((author) => author.lastName).join(", ")}
      </p>
      <div className="mt-2 border-b-2 border-[#d9726a]" />
      <dl
        className={`grid grid-cols-[6rem_1fr] text-sm ${compact ? "[--row:1.75rem]" : "[--row:2.25rem]"}`}
      >
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
      <dt className="text-muted flex min-h-(--row) items-center border-b border-[#c9d9ee] pt-1 pb-1.5">
        {term}
      </dt>
      <dd className="flex min-h-(--row) min-w-0 items-center border-b border-[#c9d9ee] pt-1 pb-1.5 tabular-nums">
        <span className="break-words">{children}</span>
      </dd>
    </>
  );
}
